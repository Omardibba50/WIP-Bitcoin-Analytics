import React, { Component } from 'react';
import { Card, LoadingSpinner } from './ui';
import { colors } from '../styles/designSystem';
import styles from './ChartWrapper.module.css';

/**
 * Error Boundary Component for Charts
 */
class ChartErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Chart Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className={styles.container}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <h3>Chart Error</h3>
            <p>Failed to load chart data</p>
            <button 
              onClick={this.props.onRetry}
              className={styles.retryButton}
            >
              Try Again
            </button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Standardized Chart Wrapper Component
 * 
 * Features:
 * - Error boundary for crash prevention
 * - Consistent styling and layout
 * - Refresh button with loading state
 * - Data source attribution
 * - Standardized header layout
 * - Loading and error states
 */
const ChartWrapper = ({
  title,
  subtitle,
  children,
  loading,
  error,
  onRefresh,
  dataSource,
  actions,
  className,
  showRefresh = true,
  timeRangeComponent,
  metricsComponent,
}) => {
  const handleRefresh = () => {
    if (onRefresh && !loading) {
      onRefresh();
    }
  };

  return (
    <Card className={`${styles.container} ${className || ''}`}>
      <ChartErrorBoundary onRetry={handleRefresh}>
        {/* Header Section */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <div>
              <h3 className={styles.title}>{title}</h3>
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            {dataSource && (
              <div className={styles.dataSource}>
                <span className={styles.dataSourceLabel}>Source:</span>
                <span className={styles.dataSourceValue}>{dataSource}</span>
              </div>
            )}
          </div>
          
          <div className={styles.headerActions}>
            {timeRangeComponent && (
              <div className={styles.timeRangeContainer}>
                {timeRangeComponent}
              </div>
            )}
            
            <div className={styles.actions}>
              {actions}
              
              {showRefresh && (
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className={`${styles.refreshButton} ${loading ? styles.loading : ''}`}
                  title="Refresh data"
                >
                  {loading ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Metrics Section */}
        {metricsComponent && (
          <div className={styles.metricsSection}>
            {metricsComponent}
          </div>
        )}

        {/* Chart Content */}
        <div className={styles.chartContainer}>
          {loading && (
            <div className={styles.loadingContainer}>
              <LoadingSpinner size="medium" />
              <p>Loading chart data...</p>
            </div>
          )}

          {error && !loading && (
            <div className={styles.errorContainer}>
              <div className={styles.errorIcon}>⚠️</div>
              <p>Error: {error.message || 'Failed to load data'}</p>
              {onRefresh && (
                <button onClick={handleRefresh} className={styles.retryButton}>
                  Retry
                </button>
              )}
            </div>
          )}

          {!loading && !error && children}
        </div>

        {/* Footer with additional info */}
        {!loading && !error && (
          <div className={styles.footer}>
            <div className={styles.lastUpdated}>
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        )}
      </ChartErrorBoundary>
    </Card>
  );
};

export default ChartWrapper;
