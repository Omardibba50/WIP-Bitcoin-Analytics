/**
 * Data Orchestration Layer
 * Central state management with 3-tier priority loading, caching, and subscriptions
 */

import { DATA_PRIORITY, CACHE_TTL } from '../constants/config';
import { dashboardApi, priceApi, blockApi, aiApi, mempoolApi, miningApi, treasuryApi, metricsApi, lightningApi } from './apiClient';
import { logger } from '../utils/logger';

const orchLogger = logger.createScope('DataOrchestrator');

/**
 * Data Orchestrator Class
 */
class DataOrchestrator {
  constructor() {
    this.state = {
      critical: {},
      secondary: {},
      tertiary: {},
    };
    this.loading = {
      critical: false,
      secondary: false,
      tertiary: false,
    };
    this.errors = {
      critical: null,
      secondary: null,
      tertiary: null,
    };
    this.subscribers = new Set();
    this.lastFetch = {
      critical: 0,
      secondary: 0,
      tertiary: 0,
    };
  }

  /**
   * Subscribe to state updates
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers
   */
  notify() {
    this.subscribers.forEach(callback => {
      try {
        callback({
          state: this.state,
          loading: this.loading,
          errors: this.errors,
        });
      } catch (error) {
        orchLogger.error('Subscriber notification failed', error);
      }
    });
  }

  /**
   * Update tier state
   */
  updateTier(tier, data, error = null) {
    if (data) {
      this.state[tier] = { ...this.state[tier], ...data };
      this.lastFetch[tier] = Date.now();
    }
    this.errors[tier] = error;
    this.loading[tier] = false;
    this.notify();
  }

  /**
   * Fetch Tier 1 Critical Data (<500ms target)
   * Price summary, latest block, AI prediction
   */
  async fetchCriticalData() {
    if (this.loading.critical) {
      orchLogger.debug('Critical data fetch already in progress');
      return this.state.critical;
    }

    this.loading.critical = true;
    this.notify();

    const startTime = Date.now();

    try {
      const results = await Promise.allSettled([
        priceApi.getSummary().then(res => ({ priceSummary: res?.data || res })),
        blockApi.getLatest(1).then(data => ({ latestBlock: data[0] || null })),
        aiApi.getPredictions().then(res => {
          console.log('🔥 RAW AI API Response:', JSON.stringify(res, null, 2));
          console.log('🔥 Has prediction property?', !!res?.prediction);
          console.log('🔥 Predicted price:', res?.prediction?.predicted_price || res?.predicted_price);
          const extracted = res?.prediction || res;
          console.log('🔥 EXTRACTED aiPrediction:', JSON.stringify(extracted, null, 2));
          return { aiPrediction: extracted };
        }),
      ]);

      const criticalData = {};
      const errors = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          Object.assign(criticalData, result.value);
        } else {
          const labels = ['priceSummary', 'latestBlock', 'aiPrediction'];
          errors.push({ field: labels[index], error: result.reason });
          orchLogger.error(`Critical data fetch failed: ${labels[index]}`, result.reason);
        }
      });

      const duration = Date.now() - startTime;
      orchLogger.performance('critical-data-load', duration);

      if (duration > DATA_PRIORITY.TIER_1_CRITICAL.timeout) {
        orchLogger.warn(`Critical data load exceeded target: ${duration}ms`);
      }

      this.updateTier('critical', criticalData, errors.length > 0 ? errors : null);
      
      return criticalData;
    } catch (error) {
      orchLogger.error('Critical data fetch failed', error);
      this.updateTier('critical', null, error);
      throw error;
    }
  }

  /**
   * Fetch Tier 2 Secondary Data (<2s target)
   * Price history, models, treasuries, mempool stats
   */
  async fetchSecondaryData() {
    if (this.loading.secondary) {
      orchLogger.debug('Secondary data fetch already in progress');
      return this.state.secondary;
    }

    this.loading.secondary = true;
    this.notify();

    const startTime = Date.now();

    try {
      const results = await Promise.allSettled([
        priceApi.getHistory({ limit: 100 }).then(res => ({ priceHistory: res?.data || res })),
        priceApi.getAllTimeHigh().then(data => ({ allTimeHigh: data })),
        aiApi.getModels().then(data => ({ models: data })),
        treasuryApi.getList().then(data => ({ treasuries: data })),
        mempoolApi.getStats().then(data => ({ mempoolStats: data })),
        miningApi.getEconomics().then(data => ({ miningEconomics: data })),
      ]);

      const secondaryData = {};
      const errors = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          Object.assign(secondaryData, result.value);
        } else {
          const labels = ['priceHistory', 'allTimeHigh', 'models', 'treasuries', 'mempoolStats', 'miningEconomics'];
          errors.push({ field: labels[index], error: result.reason });
          orchLogger.error(`Secondary data fetch failed: ${labels[index]}`, result.reason);
        }
      });

      const duration = Date.now() - startTime;
      orchLogger.performance('secondary-data-load', duration);

      if (duration > DATA_PRIORITY.TIER_2_SECONDARY.timeout) {
        orchLogger.warn(`Secondary data load exceeded target: ${duration}ms`);
      }

      this.updateTier('secondary', secondaryData, errors.length > 0 ? errors : null);
      
      return secondaryData;
    } catch (error) {
      orchLogger.error('Secondary data fetch failed', error);
      this.updateTier('secondary', null, error);
      throw error;
    }
  }

  /**
   * Fetch Tier 3 Background Data (<5s target)
   * Gold comparison, correlations, historical charts
   */
  async fetchBackgroundData() {
    if (this.loading.tertiary) {
      orchLogger.debug('Background data fetch already in progress');
      return this.state.tertiary;
    }

    this.loading.tertiary = true;
    this.notify();

    const startTime = Date.now();

    try {
      const results = await Promise.allSettled([
        metricsApi.getCorrelations().then(data => ({ correlations: data })),
        lightningApi.getStats().then(data => ({ lightningStats: data })),
        miningApi.getHashrateHistory({ limit: 100 }).then(data => ({ hashrateHistory: data })),
        miningApi.getDifficultyHistory({ limit: 100 }).then(data => ({ difficultyHistory: data })),
        metricsApi.getOverview().then(data => ({ metricsOverview: data })),
      ]);

      const tertiaryData = {};
      const errors = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          Object.assign(tertiaryData, result.value);
        } else {
          const labels = ['correlations', 'lightningStats', 'hashrateHistory', 'difficultyHistory', 'metricsOverview'];
          errors.push({ field: labels[index], error: result.reason });
          orchLogger.error(`Background data fetch failed: ${labels[index]}`, result.reason);
        }
      });

      const duration = Date.now() - startTime;
      orchLogger.performance('background-data-load', duration);

      if (duration > DATA_PRIORITY.TIER_3_BACKGROUND.timeout) {
        orchLogger.warn(`Background data load exceeded target: ${duration}ms`);
      }

      this.updateTier('tertiary', tertiaryData, errors.length > 0 ? errors : null);
      
      return tertiaryData;
    } catch (error) {
      orchLogger.error('Background data fetch failed', error);
      this.updateTier('tertiary', null, error);
      throw error;
    }
  }

  /**
   * Initialize dashboard with progressive loading
   */
  async initializeDashboard(options = {}) {
    const {
      forceRefresh = false,
    } = options;

    const totalStartTime = Date.now();
    orchLogger.info('Initializing dashboard...');

    this.loading = { critical: true, secondary: true, tertiary: true };
    this.notify();

    try {
      // Use the single, efficient dashboard endpoint
      const response = await dashboardApi.init({ forceRefresh });
      
      orchLogger.debug('Dashboard API response:', response);

      // Handle response structure: { success: true, data: { critical, secondary }, errors: {...} }
      if (!response || !response.success) {
        throw new Error(response?.error || 'Dashboard initialization failed');
      }

      const { data, errors } = response;

      if (!data) {
        throw new Error("Dashboard initialization failed to return data");
      }

      // Update critical and secondary tiers from dashboard endpoint
      if (data.critical) {
        this.updateTier('critical', data.critical, errors?.critical || null);
      }
      
      if (data.secondary) {
        this.updateTier('secondary', data.secondary, errors?.secondary || null);
      }

      // Fetch tertiary data in the background (not provided by dashboard endpoint)
      this.fetchBackgroundData().catch(error => {
        orchLogger.error('Background data fetch failed', error);
      });

      const totalDuration = Date.now() - totalStartTime;
      orchLogger.performance('dashboard-init-total', totalDuration);
      orchLogger.info(`Dashboard initialized in ${totalDuration}ms`);

      return {
        critical: this.state.critical,
        secondary: this.state.secondary,
        tertiary: this.state.tertiary,
        duration: totalDuration,
      };
    } catch (error) {
      orchLogger.error('Dashboard initialization failed', error);
      this.errors = { critical: error, secondary: error, tertiary: error };
      this.loading = { critical: false, secondary: false, tertiary: false };
      this.notify();
      throw error;
    }
  }

  /**
   * Refresh specific tier
   */
  async refreshTier(tier) {
    switch (tier) {
      case 'critical':
        return this.fetchCriticalData();
      case 'secondary':
        return this.fetchSecondaryData();
      case 'tertiary':
        return this.fetchBackgroundData();
      default:
        throw new Error(`Invalid tier: ${tier}`);
    }
  }

  /**
   * Refresh specific data field
   */
  async refreshField(field) {
    orchLogger.info(`Refreshing field: ${field}`);
    
    const fieldMap = {
      // Critical
      priceSummary: () => priceApi.getSummary().then(res => res?.data || res),
      latestBlock: () => blockApi.getLatest(1).then(data => data[0]),
      aiPrediction: () => aiApi.getPredictions().then(res => res?.prediction || res),
      
      // Secondary
      priceHistory: () => priceApi.getHistory({ limit: 100 }).then(res => res?.data || res),
      allTimeHigh: () => priceApi.getAllTimeHigh(),
      models: () => aiApi.getModels(),
      treasuries: () => treasuryApi.getList(),
      mempoolStats: () => mempoolApi.getStats(),
      miningEconomics: () => miningApi.getEconomics(),
      
      // Tertiary
      correlations: () => metricsApi.getCorrelations(),
      lightningStats: () => lightningApi.getStats(),
      hashrateHistory: () => miningApi.getHashrateHistory({ limit: 100 }),
      difficultyHistory: () => miningApi.getDifficultyHistory({ limit: 100 }),
      metricsOverview: () => metricsApi.getOverview(),
    };

    const fetchFn = fieldMap[field];
    if (!fetchFn) {
      throw new Error(`Unknown field: ${field}`);
    }

    try {
      const data = await fetchFn();
      
      // Determine which tier this field belongs to
      const criticalFields = ['priceSummary', 'latestBlock', 'aiPrediction'];
      const secondaryFields = ['priceHistory', 'allTimeHigh', 'models', 'treasuries', 'mempoolStats', 'miningEconomics'];
      
      let tier = 'tertiary';
      if (criticalFields.includes(field)) tier = 'critical';
      else if (secondaryFields.includes(field)) tier = 'secondary';
      
      this.updateTier(tier, { [field]: data });
      
      return data;
    } catch (error) {
      orchLogger.error(`Failed to refresh field: ${field}`, error);
      throw error;
    }
  }

  /**
   * Get current state snapshot
   */
  getState() {
    return {
      ...this.state.critical,
      ...this.state.secondary,
      ...this.state.tertiary,
    };
  }

  /**
   * Get loading state
   */
  getLoadingState() {
    return { ...this.loading };
  }

  /**
   * Get errors
   */
  getErrors() {
    return { ...this.errors };
  }

  /**
   * Clear all data
   */
  clear() {
    this.state = {
      critical: {},
      secondary: {},
      tertiary: {},
    };
    this.errors = {
      critical: null,
      secondary: null,
      tertiary: null,
    };
    this.loading = {
      critical: false,
      secondary: false,
      tertiary: false,
    };
    this.lastFetch = {
      critical: 0,
      secondary: 0,
      tertiary: 0,
    };
    this.notify();
    orchLogger.info('Orchestrator state cleared');
  }
}

// Export singleton instance
export const dataOrchestrator = new DataOrchestrator();

export default dataOrchestrator;
