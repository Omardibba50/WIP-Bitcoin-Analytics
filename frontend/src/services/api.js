/**
 * Centralized API service for all backend communication
 * Handles error handling, retries, and response formatting
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Base fetch wrapper with error handling
 */
async function fetchWithErrorHandling(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.message || 'Network error occurred',
      0,
      { originalError: error }
    );
  }
}

/**
 * Price API endpoints
 */
export const priceApi = {
  /**
   * Get price summary with 24h changes
   */
  async getSummary(symbol = 'BTC') {
    const response = await fetchWithErrorHandling(
      `${API_BASE_URL}/prices/summary?symbol=${symbol}`
    );
    return response.data;
  },

  /**
   * Get latest price
   */
  async getLatest(symbol = 'BTC') {
    const response = await fetchWithErrorHandling(
      `${API_BASE_URL}/prices/latest?symbol=${symbol}`
    );
    return response.data;
  },

  /**
   * Get price history
   */
  async getHistory(symbol = 'BTC', from = null, to = null, limit = 500) {
    let url = `${API_BASE_URL}/prices/history?symbol=${symbol}&limit=${limit}`;
    if (from) url += `&from=${from}`;
    if (to) url += `&to=${to}`;
    
    const response = await fetchWithErrorHandling(url);
    return response.data || [];
  },

  /**
   * Get all-time high
   */
  async getAllTimeHigh(symbol = 'BTC') {
    const response = await fetchWithErrorHandling(
      `${API_BASE_URL}/prices/ath?symbol=${symbol}`
    );
    return response.data;
  },
};

/**
 * Model API endpoints
 */
export const modelApi = {
  /**
   * Get all models
   */
  async getAll() {
    const response = await fetchWithErrorHandling(`${API_BASE_URL}/models`);
    return response.data || [];
  },

  /**
   * Create a new model
   */
  async create(modelData) {
    const response = await fetchWithErrorHandling(`${API_BASE_URL}/models`, {
      method: 'POST',
      body: JSON.stringify(modelData),
    });
    return response;
  },
};

/**
 * Prediction API endpoints
 */
export const predictionApi = {
  /**
   * Get predictions for a model
   */
  async getByModel(modelId, symbol = 'BTC') {
    const response = await fetchWithErrorHandling(
      `${API_BASE_URL}/predictions?modelId=${modelId}&symbol=${symbol}`
    );
    return response.data || [];
  },

  /**
   * Create a new prediction
   */
  async create(predictionData) {
    const response = await fetchWithErrorHandling(`${API_BASE_URL}/predictions`, {
      method: 'POST',
      body: JSON.stringify(predictionData),
    });
    return response;
  },
};

/**
 * Block API endpoints
 */
export const blockApi = {
  /**
   * Get latest blockchain blocks
   */
  async getLatest(limit = 10) {
    const response = await fetchWithErrorHandling(
      `${API_BASE_URL}/blocks/latest?limit=${limit}`
    );
    return response.data || [];
  },
};

/**
 * Treasury API endpoints
 */
export const treasuryApi = {
  /**
   * Get all corporate treasuries
   */
  async getAll() {
    const response = await fetchWithErrorHandling(`${API_BASE_URL}/treasuries`);
    return response.data || [];
  },

  /**
   * Get treasury statistics
   */
  async getStats() {
    const response = await fetchWithErrorHandling(`${API_BASE_URL}/treasuries/stats`);
    return response.data;
  },
};

/**
 * Metrics API endpoints
 */
export const metricsApi = {
  /**
   * Get all metrics (gold, supply, treasury)
   */
  async getAll() {
    const response = await fetchWithErrorHandling(`${API_BASE_URL}/metrics/all`);
    return response.data;
  },

  /**
   * Get gold comparison metrics
   */
  async getGold() {
    const response = await fetchWithErrorHandling(`${API_BASE_URL}/metrics/gold`);
    return response.data;
  },
};

/**
 * Health check
 */
export const healthApi = {
  async check() {
    const response = await fetchWithErrorHandling(`${API_BASE_URL}/health`);
    return response;
  },
};

// Export error class for error handling in components
export { ApiError };
