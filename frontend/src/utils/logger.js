/**
 * Centralized Logging Utility
 * Environment-aware logging with production error reporting integration
 */

import { FEATURES } from '../constants/config';

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  constructor() {
    this.level = import.meta.env.MODE === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
    this.errorReportingEnabled = FEATURES.ERROR_REPORTING_ENABLED;
  }

  /**
   * Debug logging - development only
   */
  debug(message, ...args) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Info logging - development only
   */
  info(message, ...args) {
    if (this.level <= LOG_LEVELS.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Warning logging - all environments
   */
  warn(message, ...args) {
    if (this.level <= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
    
    if (this.errorReportingEnabled && import.meta.env.MODE === 'production') {
      this._reportToMonitoring('warning', message, args);
    }
  }

  /**
   * Error logging - all environments, reports to monitoring in production
   */
  error(message, error, context = {}) {
    console.error(`[ERROR] ${message}`, error, context);
    
    if (this.errorReportingEnabled && import.meta.env.MODE === 'production') {
      this._reportToMonitoring('error', message, { error, context });
    }
  }

  /**
   * API request logging
   */
  api(method, url, duration, status) {
    const level = status >= 400 ? 'error' : 'debug';
    const message = `API ${method} ${url} - ${status} (${duration}ms)`;
    
    if (level === 'error') {
      this.error(message, null, { method, url, duration, status });
    } else {
      this.debug(message);
    }
  }

  /**
   * Performance logging
   */
  performance(metric, value, context = {}) {
    this.debug(`Performance: ${metric} = ${value}`, context);
    
    if (FEATURES.PERFORMANCE_MONITORING) {
      this._reportPerformance(metric, value, context);
    }
  }

  /**
   * Report errors to external monitoring service (e.g., Sentry)
   */
  _reportToMonitoring(level, message, data) {
    try {
      // Integration point for Sentry or other error tracking services
      if (window.Sentry) {
        if (level === 'error') {
          window.Sentry.captureException(data.error || new Error(message), {
            level,
            extra: data.context || data,
          });
        } else {
          window.Sentry.captureMessage(message, {
            level,
            extra: data,
          });
        }
      }
    } catch (err) {
      console.error('Failed to report to monitoring:', err);
    }
  }

  /**
   * Report performance metrics
   */
  _reportPerformance(metric, value, context) {
    try {
      // Store locally for DevTools
      const perfData = JSON.parse(localStorage.getItem('btc_dashboard_perf') || '{}');
      
      if (!perfData[metric]) {
        perfData[metric] = [];
      }
      
      perfData[metric].push({
        value,
        timestamp: Date.now(),
        context,
      });
      
      // Keep only last 100 entries per metric
      if (perfData[metric].length > 100) {
        perfData[metric] = perfData[metric].slice(-100);
      }
      
      localStorage.setItem('btc_dashboard_perf', JSON.stringify(perfData));
      
      // Report to external service if available
      if (window.analytics && window.analytics.track) {
        window.analytics.track('Performance Metric', {
          metric,
          value,
          ...context,
        });
      }
    } catch (err) {
      // Silently fail - don't break app for logging
    }
  }

  /**
   * Create a scoped logger for specific modules
   */
  createScope(scope) {
    return {
      debug: (...args) => this.debug(`[${scope}]`, ...args),
      info: (...args) => this.info(`[${scope}]`, ...args),
      warn: (...args) => this.warn(`[${scope}]`, ...args),
      error: (message, error, context) => 
        this.error(`[${scope}] ${message}`, error, { ...context, scope }),
      api: (...args) => this.api(...args),
      performance: (...args) => this.performance(...args),
    };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience method for creating scoped loggers
export const createLogger = (scope) => logger.createScope(scope);

export default logger;
