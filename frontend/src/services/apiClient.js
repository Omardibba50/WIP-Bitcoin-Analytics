/**
 * Production-Ready Unified API Service Layer
 * Features: retry logic, timeout handling, caching, request deduplication, request queue
 */

import { API_CONFIG, API_ENDPOINTS, ERROR_MESSAGES, CACHE_TTL } from '../constants/config';
import { logger } from '../utils/logger';

const apiLogger = logger.createScope('API');

/**
 * Custom API Error
 */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.timestamp = Date.now();
  }
}

/**
 * Request Cache with TTL and localStorage persistence
 */
class RequestCache {
  constructor() {
    this.cache = new Map();
    this.storagePrefix = 'btc_dashboard_cache_';
    this.loadFromStorage();
  }

  // Load cached data from localStorage
  loadFromStorage() {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.storagePrefix)) {
          const cacheKey = key.replace(this.storagePrefix, '');
          const cached = JSON.parse(localStorage.getItem(key));
          if (cached && Date.now() <= cached.expires) {
            this.cache.set(cacheKey, cached);
          } else {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }

  set(key, data, ttl) {
    const cacheEntry = {
      data,
      expires: Date.now() + ttl,
      etag: data.etag || null,
    };
    
    // Set in-memory cache
    this.cache.set(key, cacheEntry);
    
    // Persist to localStorage for critical data
    try {
      const storageKey = this.storagePrefix + key;
      localStorage.setItem(storageKey, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  get(key) {
    // Try in-memory cache first
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      // Also remove from localStorage
      try {
        localStorage.removeItem(this.storagePrefix + key);
      } catch (error) {
        // Ignore storage errors
      }
      return null;
    }
    
    return cached;
  }

  getETag(key) {
    const cached = this.get(key);
    return cached?.etag || null;
  }

  // Get stale data for fallback during API failures
  getStale(key) {
    try {
      const storageKey = this.storagePrefix + key;
      const cached = JSON.parse(localStorage.getItem(storageKey));
      if (cached) {
        // Mark as stale but still return data
        return {
          ...cached,
          isStale: true,
          staleAge: Date.now() - cached.expires,
        };
      }
    } catch (error) {
      // Ignore storage errors
    }
    return null;
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.storagePrefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
  }

  clearExpired() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expires) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Request Deduplication
 */
class RequestDeduplicator {
  constructor() {
    this.pending = new Map();
  }

  async dedupe(key, fetcher) {
    if (this.pending.has(key)) {
      apiLogger.debug(`Request deduped: ${key}`);
      return this.pending.get(key);
    }

    const promise = fetcher()
      .finally(() => {
        this.pending.delete(key);
      });

    this.pending.set(key, promise);
    return promise;
  }
}

/**
 * Request Queue for throttling
 */
class RequestQueue {
  constructor(maxConcurrent = 6) {
    this.maxConcurrent = maxConcurrent;
    this.running = 0;
    this.queue = [];
  }

  async add(requestFn) {
    if (this.running >= this.maxConcurrent) {
      await new Promise(resolve => this.queue.push(resolve));
    }

    this.running++;
    try {
      return await requestFn();
    } finally {
      this.running--;
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

/**
 * API Client with advanced features
 */
class ApiClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.cache = new RequestCache();
    this.deduplicator = new RequestDeduplicator();
    this.queue = new RequestQueue();
    this.abortControllers = new Map();
    
    // Clear AI prediction cache on init to force fresh data
    this.clearAIPredictionCache();
    
    // Clean up expired cache every 5 minutes
    setInterval(() => this.cache.clearExpired(), 300000);
  }
  
  clearAIPredictionCache() {
    // Clear any cached AI prediction requests
    const keysToDelete = [];
    for (const [key] of this.cache.cache.entries()) {
      if (key.includes('/ai/predictions')) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.cache.delete(key));
  }

  /**
   * Create request key for caching/deduplication
   */
  createRequestKey(url, options = {}) {
    return `${options.method || 'GET'}:${url}:${JSON.stringify(options.body || '')}`;
  }

  /**
   * Exponential backoff delay
   */
  getRetryDelay(attempt) {
    return Math.min(
      API_CONFIG.RETRY.INITIAL_DELAY * Math.pow(API_CONFIG.RETRY.BACKOFF_MULTIPLIER, attempt),
      API_CONFIG.RETRY.MAX_DELAY
    );
  }

  /**
   * Base fetch with timeout
   */
  async fetchWithTimeout(url, options = {}) {
    const timeout = options.timeout || API_CONFIG.TIMEOUT.DEFAULT;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Store controller for potential cancellation
    const requestKey = this.createRequestKey(url, options);
    this.abortControllers.set(requestKey, controller);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      this.abortControllers.delete(requestKey);
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      this.abortControllers.delete(requestKey);
      
      if (error.name === 'AbortError') {
        throw new ApiError(ERROR_MESSAGES.TIMEOUT_ERROR, 408, { timeout });
      }
      throw error;
    }
  }

  /**
   * Fetch with retry logic
   */
  async fetchWithRetry(url, options = {}, attempt = 0) {
    try {
      const response = await this.fetchWithTimeout(url, options);

      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Retry on 5xx errors
        if (response.status >= 500 && attempt < API_CONFIG.RETRY.ATTEMPTS) {
          const delay = this.getRetryDelay(attempt);
          apiLogger.warn(`Retrying request (${attempt + 1}/${API_CONFIG.RETRY.ATTEMPTS}) after ${delay}ms: ${url}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.fetchWithRetry(url, options, attempt + 1);
        }

        throw new ApiError(
          errorData.error || this.getErrorMessage(response.status),
          response.status,
          errorData
        );
      }

      return response;
    } catch (error) {
      // Retry on network errors
      if (!(error instanceof ApiError) && attempt < API_CONFIG.RETRY.ATTEMPTS) {
        const delay = this.getRetryDelay(attempt);
        apiLogger.warn(`Retrying request (${attempt + 1}/${API_CONFIG.RETRY.ATTEMPTS}) after ${delay}ms: ${url}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      // Final attempt failed - try to serve stale cached data for critical endpoints
      const requestKey = this.createRequestKey(url, options);
      const staleData = this.cache.getStale(requestKey);
      
      if (staleData && this.isCriticalEndpoint(url)) {
        apiLogger.warn(`Serving stale cached data for ${url} (stale for ${Math.round(staleData.staleAge / 1000)}s)`);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ...staleData.data,
            _isStale: true,
            _staleAge: staleData.staleAge
          }),
          headers: new Headers({ 'x-cache-status': 'stale' })
        };
      }

      throw error instanceof ApiError ? error : new ApiError(
        ERROR_MESSAGES.NETWORK_ERROR,
        0,
        { originalError: error }
      );
    }
  }

  /**
   * Check if endpoint is critical and should serve stale data
   */
  isCriticalEndpoint(url) {
    const criticalEndpoints = [
      '/api/dashboard/init',
      '/api/ai/predictions/latest',
      '/api/price/latest',
      '/api/block/latest'
    ];
    return criticalEndpoints.some(endpoint => url.includes(endpoint));
  }

  /**
   * Main request method with all features
   */
  async request(endpoint, options = {}) {
    const {
      cache = true,
      cacheTTL = 30000,
      dedupe = true,
      queue = true,
      ...fetchOptions
    } = options;

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const requestKey = this.createRequestKey(url, fetchOptions);
    
    const startTime = Date.now();

    try {
      // Check cache first
      if (cache && fetchOptions.method !== 'POST') {
        const cached = this.cache.get(requestKey);
        if (cached) {
          apiLogger.debug(`Cache hit: ${requestKey}`);
          
          // Add ETag for conditional request
          if (cached.etag) {
            fetchOptions.headers = {
              ...fetchOptions.headers,
              'If-None-Match': cached.etag,
            };
          }
        }
      }

      // Create fetcher function
      const fetcher = async () => {
        const requestFn = async () => {
          const response = await this.fetchWithRetry(url, fetchOptions);
          
          // Handle 304 Not Modified
          if (response.status === 304) {
            const cached = this.cache.get(requestKey);
            return cached.data;
          }

          const data = await response.json();
          const etag = response.headers.get('ETag');

          // Cache successful responses
          if (cache && response.ok) {
            this.cache.set(requestKey, { ...data, etag }, cacheTTL);
          }

          return data;
        };

        return queue ? this.queue.add(requestFn) : requestFn();
      };

      // Dedupe or execute directly
      const result = dedupe ? await this.deduplicator.dedupe(requestKey, fetcher) : await fetcher();
      
      const duration = Date.now() - startTime;
      apiLogger.api(fetchOptions.method || 'GET', endpoint, duration, 200);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const status = error.status || 0;
      apiLogger.api(fetchOptions.method || 'GET', endpoint, duration, status);
      
      throw error;
    }
  }

  /**
   * Cancel pending request
   */
  cancelRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const requestKey = this.createRequestKey(url, options);
    const controller = this.abortControllers.get(requestKey);
    
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestKey);
      apiLogger.debug(`Request cancelled: ${requestKey}`);
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    apiLogger.info('Cache cleared');
  }

  /**
   * Get error message for status code
   */
  getErrorMessage(status) {
    switch (status) {
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND;
      case 429:
        return ERROR_MESSAGES.RATE_LIMIT;
      case 408:
        return ERROR_MESSAGES.TIMEOUT_ERROR;
      default:
        return status >= 500 ? ERROR_MESSAGES.SERVER_ERROR : ERROR_MESSAGES.UNKNOWN_ERROR;
    }
  }

  /**
   * Convenience methods
   */
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
      cache: false, // Don't cache POST requests
    });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
      cache: false,
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'DELETE',
      cache: false,
    });
  }
}

// Create singleton instance
const apiClient = new ApiClient();

/**
 * Price API
 */
export const priceApi = {
  getSummary: (symbol = 'BTC') => 
    apiClient.get(API_ENDPOINTS.PRICES.SUMMARY, { cacheTTL: 30000 }),
  
  getCurrent: (symbol = 'BTC') => 
    apiClient.get(API_ENDPOINTS.PRICES.LATEST, { cacheTTL: 30000 }),
  
  // Added convenience method used by components
  getLatest: (symbol = 'BTC') => 
    apiClient.get(API_ENDPOINTS.PRICES.LATEST, { cacheTTL: 30000 }),
  
  getHistory: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const endpoint = `${API_ENDPOINTS.PRICES.HISTORY}${qs ? `?${qs}` : ''}`;
    return apiClient.get(endpoint, { cacheTTL: 120000 });
  },

  getPerformance: () => apiClient.get(API_ENDPOINTS.PRICES.PERFORMANCE, { cacheTTL: 30000 }),
  getAllTimeHigh: (symbol = 'BTC') =>
    apiClient.get(API_ENDPOINTS.PRICES.ATH, { cacheTTL: 300000 }).then(res => res?.data || res),
};

/**
 * Block API
 */
export const blockApi = {
  getLatest: (limit = 10) => 
    apiClient.get(`${API_ENDPOINTS.BLOCKS.LATEST}?limit=${limit}`, { cacheTTL: 60000 }),
  
  getList: (params = {}) => {
    const { limit = 10, offset = 0 } = params;
    return apiClient.get(`${API_ENDPOINTS.BLOCKS.LIST}?limit=${limit}&offset=${offset}`, { cacheTTL: 60000 });
  },
  
  getByHeight: (height) => 
    apiClient.get(API_ENDPOINTS.BLOCKS.BY_HEIGHT(height), { cacheTTL: 300000 }),
  
  getPredictedNext: () => 
  Promise.reject(new ApiError('Endpoint not implemented', 404)),
};

/**
 * Mempool API
 */
export const mempoolApi = {
  getStats: () => apiClient.get(API_ENDPOINTS.MEMPOOL.STATS, { cacheTTL: 15000 }),
  
  getFees: () => Promise.reject(new ApiError('Endpoint not implemented', 404)),
  
  getRecommended: () => Promise.reject(new ApiError('Endpoint not implemented', 404)),
  
  getTransactions: () => Promise.reject(new ApiError('Endpoint not implemented', 404)),
};

/**
 * Mining API
 */
export const miningApi = {
  getEconomics: () => apiClient.get(API_ENDPOINTS.MINING.ECONOMICS, { cacheTTL: 300000 }),
  getDifficultyHistory: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiClient.get(`${API_ENDPOINTS.MINING.DIFFICULTY_HISTORY}${qs ? `?${qs}` : ''}`, { cacheTTL: 300000 });
  },
  getHashrateHistory: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiClient.get(`${API_ENDPOINTS.MINING.HASHRATE_HISTORY}${qs ? `?${qs}` : ''}`, { cacheTTL: 300000 });
  },
};

/**
 * Lightning Network API
 */
export const lightningApi = {
  getStats: () => apiClient.get(API_ENDPOINTS.LIGHTNING.STATS, { cacheTTL: 60000 }),
};

/**
 * Metrics API
 */
export const metricsApi = {
  getOverview: () => apiClient.get(API_ENDPOINTS.METRICS.OVERVIEW, { cacheTTL: 120000 }),
  getAll: () => apiClient.get(API_ENDPOINTS.METRICS.ALL, { cacheTTL: 300000 }),
  getHashrateHistory: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiClient.get(`${API_ENDPOINTS.METRICS.HASHRATE_HISTORY}${qs ? `?${qs}` : ''}`, { cacheTTL: 300000 });
  },
  getDifficultyHistory: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiClient.get(`${API_ENDPOINTS.METRICS.DIFFICULTY_HISTORY}${qs ? `?${qs}` : ''}`, { cacheTTL: 300000 });
  },
  getCorrelations: () => apiClient.get(API_ENDPOINTS.METRICS.CORRELATIONS, { cacheTTL: 300000 }),
  getGoldMetrics: () => apiClient.get(API_ENDPOINTS.METRICS.GOLD, { cacheTTL: 300000 }),
  getStockToFlowData: (days = 365) => {
    return apiClient.get(`/metrics/stock-to-flow?days=${days}`, { cacheTTL: 300000 });
  },
};

/**
 * AI/ML API
 */
export const aiApi = {
  // Latest prediction used by some components - NO CACHE to always get fresh predictions
  getLatestPrediction: () =>
    apiClient.get(API_ENDPOINTS.AI.PREDICTIONS, { cacheTTL: 0 }),

  // Alias used by DataOrchestrator for critical tier - NO CACHE
  getPredictions: () =>
    apiClient.get(API_ENDPOINTS.AI.PREDICTIONS, { cacheTTL: 0 }),

  // Historical AI predictions used by AIPredictionChart
  getPredictionHistory: (params = {}) => {
    const { limit = 50, offset = 0 } = params;
    const qs = new URLSearchParams({ limit, offset }).toString();
    // Backend: GET /api/ai/predictions/history returns { predictions, pagination }
    return apiClient
      .get(`/ai/predictions/history?${qs}`, { cacheTTL: CACHE_TTL.SECONDARY })
      .then((res) => ({ data: res.predictions || [] }));
  },

  // Live model stats (CoinGecko-backed) used by LiveModelsChart
  getModelsLive: () =>
    apiClient.get(API_ENDPOINTS.AI.MODELS_LIVE, { cacheTTL: CACHE_TTL.SECONDARY }),

  // Static/registered models list used by orchestrator refreshField("models")
  getModels: () =>
    apiClient.get(API_ENDPOINTS.AI.MODELS, { cacheTTL: CACHE_TTL.SECONDARY }),

  getStatus: () => apiClient.get(API_ENDPOINTS.AI.STATUS, { cacheTTL: CACHE_TTL.CRITICAL }),
  getModelMetrics: () =>
    apiClient.get(API_ENDPOINTS.AI.MODEL_METRICS, { cacheTTL: CACHE_TTL.SECONDARY }),
};

/**
 * Treasury API
 */
export const treasuryApi = {
  // Alias used by some older code paths
  getAll: () => apiClient.get(API_ENDPOINTS.TREASURIES.ALL, { cacheTTL: 300000 }),
  getList: () => apiClient.get(API_ENDPOINTS.TREASURIES.ALL, { cacheTTL: 300000 }),
  getStats: () => apiClient.get(API_ENDPOINTS.TREASURIES.STATS, { cacheTTL: 300000 }),
};

/**
 * Dashboard Aggregate API
 */
export const dashboardApi = {
  init: (options = {}) => 
    apiClient.get(API_ENDPOINTS.DASHBOARD.INIT, { 
      cache: !options.forceRefresh,
      cacheTTL: 30000,
      timeout: API_CONFIG.TIMEOUT.LARGE_DATASET,
    }),
};

/**
 * Health Check API
 */
export const healthApi = {
  check: () => 
    apiClient.get(API_ENDPOINTS.HEALTH, { cache: false }),
};

// Export API client for advanced usage
export { apiClient };

export default {
  price: priceApi,
  block: blockApi,
  mempool: mempoolApi,
  mining: miningApi,
  lightning: lightningApi,
  metrics: metricsApi,
  ai: aiApi,
  treasury: treasuryApi,
  dashboard: dashboardApi,
  health: healthApi,
};
