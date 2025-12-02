/**
 * Error Boundary Component
 * Catches React errors and provides graceful fallbacks
 */

import React from 'react';
import { logger } from '../utils/logger';

const errorLogger = logger.createScope('ErrorBoundary');

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error
    errorLogger.error('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      section: this.props.section || 'unknown',
    });

    // Update state
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          reset: this.handleReset,
        });
      }

      // Default error UI
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <h2 style={styles.title}>
              {this.props.title || '⚠️ Something went wrong'}
            </h2>
            <p style={styles.message}>
              {this.props.message || 'An error occurred in this section of the dashboard.'}
            </p>
            
            {import.meta.env.MODE === 'development' && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details</summary>
                <pre style={styles.errorText}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div style={styles.actions}>
              <button
                onClick={this.handleReset}
                style={styles.button}
              >
                Try Again
              </button>
              
              {this.state.errorCount > 2 && (
                <button
                  onClick={() => window.location.reload()}
                  style={{ ...styles.button, ...styles.secondaryButton }}
                >
                  Reload Page
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    minHeight: '200px',
    backgroundColor: 'rgba(234, 57, 67, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(234, 57, 67, 0.3)',
  },
  content: {
    textAlign: 'center',
    maxWidth: '500px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: '#EA3943',
  },
  message: {
    fontSize: '1rem',
    marginBottom: '1.5rem',
    color: '#ccc',
    lineHeight: '1.5',
  },
  details: {
    textAlign: 'left',
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '4px',
    maxHeight: '200px',
    overflow: 'auto',
  },
  summary: {
    cursor: 'pointer',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: '#F7931A',
  },
  errorText: {
    fontSize: '0.875rem',
    color: '#EA3943',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
  },
  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#F7931A',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  secondaryButton: {
    backgroundColor: '#555',
  },
};

export default ErrorBoundary;
