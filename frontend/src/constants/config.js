/**
 * Application Configuration Constants
 * Centralized configuration for polling intervals, timeouts, cache TTLs, and API endpoints
 */

// API Base Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:5000',
  TIMEOUT: {
    DEFAULT: 10000, // 10 seconds
    LARGE_DATASET: 30000, // 30 seconds for heavy queries
    QUICK: 5000, // 5 seconds for lightweight requests
  },
  RETRY: {
    ATTEMPTS: 3,
    INITIAL_DELAY: 1000, // 1 second
    MAX_DELAY: 10000, // 10 seconds
    BACKOFF_MULTIPLIER: 2,
  },
};

// Polling Intervals (in milliseconds)
export const POLLING_INTERVALS = {
  BLOCKS: 60000, // 1 minute - aligned with Bitcoin block time
  MEMPOOL: 15000, // 15 seconds - fast updates for pending transactions
  PRICES: 30000, // 30 seconds - balance between freshness and API load
  MINING: 300000, // 5 minutes - difficulty/hashrate changes slowly
  TREASURIES: 300000, // 5 minutes - corporate holdings update infrequently
  LIGHTNING: 60000, // 1 minute
  METRICS: 120000, // 2 minutes - general metrics
  AI_PREDICTIONS: 300000, // 5 minutes - model predictions
  NETWORK_STATS: 60000, // 1 minute
};

// Cache Time-To-Live (in milliseconds)
export const CACHE_TTL = {
  CRITICAL: 30000, // 30 seconds - prices, blocks, predictions
  SECONDARY: 120000, // 2 minutes - historical data, models, treasuries
  TERTIARY: 300000, // 5 minutes - correlations, comparisons, analytics
  STATIC: 3600000, // 1 hour - rarely changing data
};

// Data Loading Priority Tiers
export const DATA_PRIORITY = {
  TIER_1_CRITICAL: {
    label: 'Critical',
    timeout: 500, // Target <500ms
    endpoints: [
      'price-summary',
      'latest-block',
      'ai-prediction',
    ],
  },
  TIER_2_SECONDARY: {
    label: 'Secondary',
    timeout: 2000, // Target <2s
    endpoints: [
      'price-history',
      'models',
      'treasuries',
      'mempool-stats',
      'mining-economics',
    ],
  },
  TIER_3_BACKGROUND: {
    label: 'Background',
    timeout: 5000, // Target <5s
    endpoints: [
      'gold-comparison',
      'correlations',
      'historical-charts',
      'lightning-network',
      'hashrate-history',
      'difficulty-history',
    ],
  },
};

// API Endpoints (without /api prefix since baseURL already includes it)
export const API_ENDPOINTS = {
  // Price endpoints
  PRICES: {
    CURRENT: '/prices/latest',
    HISTORY: '/prices/history',
    SUMMARY: '/prices/summary',
    PERFORMANCE: '/price-performance',
    ATH: '/prices/ath',
  // Optional alias used by components
    LATEST: '/prices/latest',
  },
  
  // Block endpoints
  BLOCKS: {
    LATEST: '/blocks/latest',
    LIST: '/blocks',
    BY_HEIGHT: (height) => `/blocks/${height}`,
    PREDICTED: '/blocks/predicted-next',
  },
  
  // Mempool endpoints
  MEMPOOL: {
    STATS: '/mempool/stats',
  // The following endpoints are not implemented in backend
  FEES: null,
  RECOMMENDED: null,
  TRANSACTIONS: null,
  },
  
  // Mining endpoints
  MINING: {
    ECONOMICS: '/mining/economics',
    DIFFICULTY: '/mining/difficulty',
    DIFFICULTY_HISTORY: '/mining/difficulty/history',
    HASHRATE: '/metrics/hashrate',
    HASHRATE_HISTORY: '/metrics/hashrate/history',
  },
  
  // Lightning Network endpoints
  LIGHTNING: {
    STATS: '/lightning/stats',
  // Not implemented
  HISTORY: null,
  CHANNELS: null,
  },
  
  // Metrics endpoints
  METRICS: {
    OVERVIEW: '/metrics/overview',
    HASHRATE_HISTORY: '/metrics/hashrate/history',
    DIFFICULTY_HISTORY: '/metrics/difficulty/history',
    CORRELATIONS: '/metrics/correlations',
  // Aggregated metrics endpoint
  ALL: '/metrics/all',
  },
  
  // AI/ML endpoints
  AI: {
    // Use AI route namespace
    PREDICTIONS: '/ai/predictions/latest',
    MODELS: '/models',
    MODELS_LIVE: '/models/live',
    // Not implemented in backend under /models
    MODEL_PERFORMANCE: null,
  STATUS: '/ai/status',
  MODEL_METRICS: '/ai/model/metrics',
  },
  
  // Treasury endpoints
  TREASURIES: {
    LIST: '/treasuries',
    // Not implemented
    SUMMARY: null,
  ALL: '/treasuries',
  STATS: '/treasuries/stats',
  },
  
  // Dashboard aggregate endpoint
  DASHBOARD: {
    INIT: '/dashboard/init',
  },
  
  // Health check
  HEALTH: '/health',
};

// Performance Thresholds
export const PERFORMANCE_THRESHOLDS = {
  TTFB: 600, // Time to First Byte (ms)
  FCP: 1800, // First Contentful Paint (ms)
  LCP: 2500, // Largest Contentful Paint (ms)
  TTI: 3800, // Time to Interactive (ms)
  CLS: 0.1, // Cumulative Layout Shift (score)
  FID: 100, // First Input Delay (ms)
};

// Bundle Size Budgets
export const BUNDLE_BUDGETS = {
  INITIAL: 300, // KB - Initial bundle size
  LAZY_CHUNK: 100, // KB - Lazy loaded chunk size
  VENDOR: 200, // KB - Vendor bundle size
};

// Feature Flags
export const FEATURES = {
  WEBSOCKET_ENABLED: import.meta.env.VITE_FEATURE_WEBSOCKET !== 'false',
  SERVICE_WORKER_ENABLED: import.meta.env.VITE_FEATURE_SW !== 'false',
  DEV_TOOLS_ENABLED: import.meta.env.MODE === 'development',
  ERROR_REPORTING_ENABLED: import.meta.env.VITE_FEATURE_ERROR_REPORTING === 'true',
  PERFORMANCE_MONITORING: import.meta.env.VITE_FEATURE_PERF_MONITORING === 'true',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  NOT_FOUND: 'Requested resource not found.',
  UNAUTHORIZED: 'Authentication required.',
  RATE_LIMIT: 'Too many requests. Please wait a moment.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  CACHE_PREFIX: 'btc_dashboard_cache_',
  USER_PREFERENCES: 'btc_dashboard_prefs',
  PERFORMANCE_METRICS: 'btc_dashboard_perf',
};

// Chart Configuration
export const CHART_DEFAULTS = {
  HEIGHT: 400,
  ANIMATION_DURATION: 750,
  POINTS_VISIBLE_THRESHOLD: 100,
  COLORS: {
    BITCOIN_ORANGE: '#F7931A',
    BULLISH_GREEN: '#16C784',
    BEARISH_RED: '#EA3943',
    GRID: 'rgba(255, 255, 255, 0.1)',
  },
};

export default {
  API_CONFIG,
  POLLING_INTERVALS,
  CACHE_TTL,
  DATA_PRIORITY,
  API_ENDPOINTS,
  PERFORMANCE_THRESHOLDS,
  BUNDLE_BUDGETS,
  FEATURES,
  ERROR_MESSAGES,
  STORAGE_KEYS,
  CHART_DEFAULTS,
};
