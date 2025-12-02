/**
 * Dashboard Data Hook
 * Consumes data orchestrator and provides dashboard state
 */

import { useState, useEffect, useCallback } from 'react';
import { dataOrchestrator } from '../services/dataOrchestrator';
import { logger } from '../utils/logger';

const dashLogger = logger.createScope('useDashboardData');

/**
 * useDashboardData - Main hook for dashboard components
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoInit - Automatically initialize on mount
 * @param {boolean} options.skipCritical - Skip critical tier
 * @param {boolean} options.skipSecondary - Skip secondary tier
 * @param {boolean} options.skipBackground - Skip background tier
 * 
 * @returns {Object} Dashboard state and controls
 */
export function useDashboardData(options = {}) {
  const {
    autoInit = true,
    skipCritical = false,
    skipSecondary = false,
    skipBackground = false,
  } = options;

  const [state, setState] = useState({
    critical: {},
    secondary: {},
    tertiary: {},
  });

  const [loading, setLoading] = useState({
    critical: false,
    secondary: false,
    tertiary: false,
  });

  const [errors, setErrors] = useState({
    critical: null,
    secondary: null,
    tertiary: null,
  });

  const [initialized, setInitialized] = useState(false);

  /**
   * Handle orchestrator updates
   */
  const handleUpdate = useCallback((update) => {
    setState(update.state);
    setLoading(update.loading);
    setErrors(update.errors);
  }, []);

  /**
   * Initialize dashboard
   */
  const initialize = useCallback(async (forceRefresh = false) => {
    dashLogger.info('Initializing dashboard data');
    
    try {
      await dataOrchestrator.initializeDashboard({
        skipCritical,
        skipSecondary,
        skipBackground,
        forceRefresh,
      });
      
      setInitialized(true);
      dashLogger.info('Dashboard data initialized');
    } catch (error) {
      dashLogger.error('Dashboard initialization failed', error);
    }
  }, [skipCritical, skipSecondary, skipBackground]);

  /**
   * Refresh specific tier
   */
  const refreshTier = useCallback(async (tier) => {
    try {
      await dataOrchestrator.refreshTier(tier);
    } catch (error) {
      dashLogger.error(`Failed to refresh tier: ${tier}`, error);
    }
  }, []);

  /**
   * Refresh specific field
   */
  const refreshField = useCallback(async (field) => {
    try {
      await dataOrchestrator.refreshField(field);
    } catch (error) {
      dashLogger.error(`Failed to refresh field: ${field}`, error);
    }
  }, []);

  /**
   * Clear all data
   */
  const clear = useCallback(() => {
    dataOrchestrator.clear();
    setInitialized(false);
  }, []);

  /**
   * Subscribe to orchestrator updates
   */
  useEffect(() => {
    const unsubscribe = dataOrchestrator.subscribe(handleUpdate);

    // Get initial state
    setState({
      critical: dataOrchestrator.state.critical,
      secondary: dataOrchestrator.state.secondary,
      tertiary: dataOrchestrator.state.tertiary,
    });

    setLoading(dataOrchestrator.getLoadingState());
    setErrors(dataOrchestrator.getErrors());

    return unsubscribe;
  }, [handleUpdate]);

  /**
   * Auto-initialize on mount
   */
  useEffect(() => {
    if (autoInit && !initialized) {
      initialize();
    }
  }, [autoInit, initialized, initialize]);

  // Flatten state for easier access
  const allData = {
    ...state.critical,
    ...state.secondary,
    ...state.tertiary,
  };

  return {
    // Data
    ...allData,
    critical: state.critical,
    secondary: state.secondary,
    tertiary: state.tertiary,
    
    // Loading states
    loading,
    isLoading: loading.critical || loading.secondary || loading.tertiary,
    isCriticalLoading: loading.critical,
    isSecondaryLoading: loading.secondary,
    isBackgroundLoading: loading.tertiary,
    
    // Errors
    errors,
    hasErrors: errors.critical || errors.secondary || errors.tertiary,
    
    // Status
    initialized,
    
    // Actions
    initialize,
    refreshTier,
    refreshField,
    clear,
  };
}

export default useDashboardData;
