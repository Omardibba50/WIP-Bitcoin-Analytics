/**
 * Performance Monitoring Utility
 * Tracks Web Vitals and custom performance metrics
 */

import { PERFORMANCE_THRESHOLDS } from '../constants/config';
import { logger } from './logger';

const perfLogger = logger.createScope('Performance');

/**
 * Performance Metrics Store
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      webVitals: {},
      api: [],
      renders: [],
      custom: {},
    };
    this.observers = new Set();
    this.initialized = false;
  }

  /**
   * Initialize performance monitoring
   */
  init() {
    if (this.initialized || typeof window === 'undefined') return;

    this.initialized = true;

    // Monitor Core Web Vitals
    this.monitorWebVitals();

    // Monitor Navigation Timing
    this.monitorNavigationTiming();

    // Monitor Resource Timing
    this.monitorResourceTiming();

    perfLogger.info('Performance monitoring initialized');
  }

  /**
   * Monitor Core Web Vitals (FCP, LCP, FID, CLS, TTFB)
   */
  monitorWebVitals() {
    // Use web-vitals library if available, otherwise use Performance API
    if (window.PerformanceObserver) {
      // Largest Contentful Paint (LCP)
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          const lcp = lastEntry.renderTime || lastEntry.loadTime;
          
          this.recordMetric('LCP', lcp, PERFORMANCE_THRESHOLDS.LCP);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        perfLogger.warn('LCP observer not supported');
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const fid = entry.processingStart - entry.startTime;
            this.recordMetric('FID', fid, PERFORMANCE_THRESHOLDS.FID);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        perfLogger.warn('FID observer not supported');
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.recordMetric('CLS', clsValue, PERFORMANCE_THRESHOLDS.CLS);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        perfLogger.warn('CLS observer not supported');
      }
    }

    // First Contentful Paint (FCP)
    if (window.performance && window.performance.getEntriesByType) {
      const paintEntries = window.performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
      
      if (fcpEntry) {
        this.recordMetric('FCP', fcpEntry.startTime, PERFORMANCE_THRESHOLDS.FCP);
      }
    }
  }

  /**
   * Monitor Navigation Timing
   */
  monitorNavigationTiming() {
    if (!window.performance || !window.performance.timing) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = window.performance.timing;
        const navigation = window.performance.navigation;

        // Time to First Byte (TTFB)
        const ttfb = timing.responseStart - timing.requestStart;
        this.recordMetric('TTFB', ttfb, PERFORMANCE_THRESHOLDS.TTFB);

        // DOM Content Loaded
        const dcl = timing.domContentLoadedEventEnd - timing.navigationStart;
        this.recordMetric('DCL', dcl);

        // Page Load Time
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        this.recordMetric('LoadTime', loadTime);

        // DNS Lookup Time
        const dnsTime = timing.domainLookupEnd - timing.domainLookupStart;
        this.recordMetric('DNS', dnsTime);

        // TCP Connection Time
        const tcpTime = timing.connectEnd - timing.connectStart;
        this.recordMetric('TCP', tcpTime);

        // Time to Interactive (TTI) - approximate
        const tti = timing.domInteractive - timing.navigationStart;
        this.recordMetric('TTI', tti, PERFORMANCE_THRESHOLDS.TTI);

        perfLogger.info('Navigation timing recorded', {
          ttfb,
          dcl,
          loadTime,
          tti,
        });
      }, 0);
    });
  }

  /**
   * Monitor Resource Timing
   */
  monitorResourceTiming() {
    if (!window.performance || !window.performance.getEntriesByType) return;

    const resources = window.performance.getEntriesByType('resource');
    
    const summary = {
      total: resources.length,
      byType: {},
      totalDuration: 0,
      totalSize: 0,
    };

    resources.forEach((resource) => {
      const type = resource.initiatorType || 'other';
      
      if (!summary.byType[type]) {
        summary.byType[type] = { count: 0, duration: 0 };
      }
      
      summary.byType[type].count++;
      summary.byType[type].duration += resource.duration;
      summary.totalDuration += resource.duration;
      
      if (resource.transferSize) {
        summary.totalSize += resource.transferSize;
      }
    });

    this.metrics.custom.resources = summary;
    perfLogger.debug('Resource timing recorded', summary);
  }

  /**
   * Record a performance metric
   */
  recordMetric(name, value, threshold = null) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      threshold,
      status: threshold ? (value <= threshold ? 'good' : 'poor') : 'info',
    };

    this.metrics.webVitals[name] = metric;

    // Log if exceeding threshold
    if (threshold && value > threshold) {
      perfLogger.warn(`${name} exceeded threshold: ${value}ms > ${threshold}ms`);
    } else {
      perfLogger.performance(name, value);
    }

    // Notify observers
    this.notifyObservers('metric', metric);

    return metric;
  }

  /**
   * Record API request performance
   */
  recordApiRequest(endpoint, method, duration, status, size = null) {
    const apiMetric = {
      endpoint,
      method,
      duration,
      status,
      size,
      timestamp: Date.now(),
      success: status >= 200 && status < 300,
    };

    this.metrics.api.push(apiMetric);

    // Keep only last 100 API requests
    if (this.metrics.api.length > 100) {
      this.metrics.api = this.metrics.api.slice(-100);
    }

    perfLogger.debug(`API ${method} ${endpoint}: ${duration}ms (${status})`);

    // Notify observers
    this.notifyObservers('api', apiMetric);

    return apiMetric;
  }

  /**
   * Record component render performance
   */
  recordRender(componentName, duration, reason = null) {
    const renderMetric = {
      component: componentName,
      duration,
      reason,
      timestamp: Date.now(),
    };

    this.metrics.renders.push(renderMetric);

    // Keep only last 50 renders
    if (this.metrics.renders.length > 50) {
      this.metrics.renders = this.metrics.renders.slice(-50);
    }

    if (duration > 16) {
      // Render took longer than one frame (60fps = 16.67ms)
      perfLogger.warn(`Slow render: ${componentName} took ${duration}ms`);
    }

    // Notify observers
    this.notifyObservers('render', renderMetric);

    return renderMetric;
  }

  /**
   * Record custom metric
   */
  recordCustom(name, value, metadata = {}) {
    const customMetric = {
      name,
      value,
      metadata,
      timestamp: Date.now(),
    };

    if (!this.metrics.custom[name]) {
      this.metrics.custom[name] = [];
    }

    this.metrics.custom[name].push(customMetric);

    // Keep only last 50 entries per metric
    if (this.metrics.custom[name].length > 50) {
      this.metrics.custom[name] = this.metrics.custom[name].slice(-50);
    }

    perfLogger.debug(`Custom metric: ${name} = ${value}`, metadata);

    // Notify observers
    this.notifyObservers('custom', customMetric);

    return customMetric;
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const apiMetrics = this.metrics.api;
    const totalRequests = apiMetrics.length;
    const successfulRequests = apiMetrics.filter(m => m.success).length;
    const avgDuration = totalRequests > 0
      ? apiMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests
      : 0;

    return {
      webVitals: this.metrics.webVitals,
      api: {
        totalRequests,
        successfulRequests,
        failedRequests: totalRequests - successfulRequests,
        successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
        avgDuration: Math.round(avgDuration),
        slowestRequest: apiMetrics.length > 0
          ? apiMetrics.reduce((max, m) => m.duration > max.duration ? m : max, apiMetrics[0])
          : null,
      },
      renders: {
        total: this.metrics.renders.length,
        slowRenders: this.metrics.renders.filter(r => r.duration > 16).length,
        avgDuration: this.metrics.renders.length > 0
          ? Math.round(this.metrics.renders.reduce((sum, r) => sum + r.duration, 0) / this.metrics.renders.length)
          : 0,
      },
      custom: this.metrics.custom,
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    return this.metrics;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = {
      webVitals: {},
      api: [],
      renders: [],
      custom: {},
    };
    perfLogger.info('Performance metrics cleared');
  }

  /**
   * Subscribe to performance updates
   */
  subscribe(callback) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  /**
   * Notify all observers
   */
  notifyObservers(type, data) {
    this.observers.forEach((callback) => {
      try {
        callback({ type, data, summary: this.getSummary() });
      } catch (error) {
        perfLogger.error('Observer notification failed', error);
      }
    });
  }

  /**
   * Export metrics for external analytics
   */
  export() {
    return {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: this.getSummary(),
    };
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      performanceMonitor.init();
    });
  } else {
    performanceMonitor.init();
  }
}

/**
 * React Hook for performance monitoring
 */
export function usePerformance(componentName) {
  const startTime = performance.now();

  return {
    recordRender: (reason) => {
      const duration = performance.now() - startTime;
      performanceMonitor.recordRender(componentName, duration, reason);
    },
    recordCustom: (name, value, metadata) => {
      performanceMonitor.recordCustom(name, value, { ...metadata, component: componentName });
    },
  };
}

export default performanceMonitor;
