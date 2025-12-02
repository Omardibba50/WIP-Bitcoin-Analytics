/**
 * Production-Grade Data Fetching Hook
 * Features: smart polling, visibility API, exponential backoff, stale-while-revalidate
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '../utils/logger';

const hookLogger = logger.createScope('useDataFetch');

/**
 * useDataFetch - Universal data fetching hook with advanced features
 * 
 * @param {Function} fetchFn - Async function that fetches data
 * @param {Object} options - Configuration options
 * @param {number} options.interval - Polling interval in ms (0 = no polling)
 * @param {string} options.priority - Priority tier: 'critical', 'secondary', 'tertiary'
 * @param {boolean} options.cache - Enable caching (uses fetchFn caching if available)
 * @param {number} options.retries - Number of retry attempts on error
 * @param {boolean} options.enabled - Enable/disable fetching
 * @param {Array} options.dependencies - Dependencies that trigger refetch
 * @param {Function} options.onSuccess - Success callback
 * @param {Function} options.onError - Error callback
 * @param {boolean} options.pauseWhenHidden - Pause polling when tab is hidden
 * @param {boolean} options.staleWhileRevalidate - Show stale data while revalidating
 * 
 * @returns {Object} { data, loading, error, refetch, isStale }
 */
export function useDataFetch(fetchFn, options = {}) {
  const {
    interval = 0,
    priority = 'secondary',
    cache = true,
    retries = 3,
    enabled = true,
    dependencies = [],
    onSuccess,
    onError,
    pauseWhenHidden = true,
    staleWhileRevalidate = true,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);
  
  const intervalRef = useRef(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef(null);
  const isVisibleRef = useRef(!document.hidden);
  const lastFetchRef = useRef(0);
  const isMountedRef = useRef(true);

  /**
   * Exponential backoff delay calculator
   */
  const getRetryDelay = useCallback((attempt) => {
    return Math.min(1000 * Math.pow(2, attempt), 10000);
  }, []);

  /**
   * Core fetch function with retry logic
   */
  const executeFetch = useCallback(async (isRetry = false, showLoadingState = true) => {
    if (!enabled) return;

    try {
      if (showLoadingState && !isRetry) {
        setLoading(true);
        setError(null);
      }

      if (staleWhileRevalidate && data !== null) {
        setIsStale(true);
      }

      const startTime = Date.now();
  const result = await fetchFn();
  // Normalize common API shape { data: ... }
  const normalized = (result && Object.prototype.hasOwnProperty.call(result, 'data')) ? result.data : result;
      const duration = Date.now() - startTime;

      if (!isMountedRef.current) return;

      hookLogger.performance(`fetch-${priority}`, duration);

  setData(normalized);
      setLoading(false);
      setError(null);
      setIsStale(false);
      retryCountRef.current = 0;
      lastFetchRef.current = Date.now();

      if (onSuccess) {
        onSuccess(normalized);
      }
      return normalized;
    } catch (err) {
      if (!isMountedRef.current) return;

      hookLogger.error(`Fetch failed (priority: ${priority})`, err);

      // Retry logic with exponential backoff
      if (retryCountRef.current < retries) {
        const delay = getRetryDelay(retryCountRef.current);
        hookLogger.info(`Retrying in ${delay}ms (attempt ${retryCountRef.current + 1}/${retries})`);
        
        retryCountRef.current += 1;

        retryTimeoutRef.current = setTimeout(() => {
          executeFetch(true, false);
        }, delay);
        
        return;
      }

      // Max retries reached
      setLoading(false);
      setError(err);
      setIsStale(false);
      retryCountRef.current = 0;

      if (onError) {
        onError(err);
      }
    }
  }, [enabled, retries, priority, staleWhileRevalidate, getRetryDelay, onSuccess, onError]);

  /**
   * Manual refetch function
   */
  const refetch = useCallback(() => {
    retryCountRef.current = 0;
    return executeFetch(false, true);
  }, [executeFetch]);

  /**
   * Handle visibility change
   */
  useEffect(() => {
    if (!pauseWhenHidden || interval === 0) return;

    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      isVisibleRef.current = isVisible;

      if (isVisible) {
        hookLogger.debug(`Tab visible, resuming polling (${priority})`);
        
        // Refetch immediately if data is stale
        const timeSinceLastFetch = Date.now() - lastFetchRef.current;
        if (timeSinceLastFetch > interval) {
          executeFetch(false, false);
        }
      } else {
        hookLogger.debug(`Tab hidden, pausing polling (${priority})`);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseWhenHidden, interval, priority, executeFetch]);

  /**
   * Initial fetch and polling setup
   */
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // Initial fetch
    executeFetch();

    // Setup polling
    if (interval > 0) {
      hookLogger.debug(`Starting polling with interval ${interval}ms (${priority})`);
      
      intervalRef.current = setInterval(() => {
        // Only poll if tab is visible (or pauseWhenHidden is false)
        if (!pauseWhenHidden || isVisibleRef.current) {
          executeFetch(false, false);
        }
      }, interval);
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [enabled, interval, priority, pauseWhenHidden, executeFetch, ...dependencies]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    isStale,
  };
}

export default useDataFetch;
