/**
 * Error Handler Hook
 * Provides consistent error UI patterns and retry mechanisms
 */

import { useState, useCallback } from 'react';
import { logger } from '../utils/logger';
import { ERROR_MESSAGES } from '../constants/config';

const errorLogger = logger.createScope('useErrorHandler');

/**
 * useErrorHandler - Centralized error handling hook
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.onError - Callback when error occurs
 * @param {number} options.maxRetries - Maximum retry attempts
 * @param {boolean} options.showToast - Show toast notification
 * 
 * @returns {Object} Error state and handlers
 */
export function useErrorHandler(options = {}) {
  const {
    onError,
    maxRetries = 3,
    showToast = true,
  } = options;

  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  /**
   * Get user-friendly error message
   */
  const getErrorMessage = useCallback((err) => {
    if (err?.status) {
      switch (err.status) {
        case 401:
          return ERROR_MESSAGES.UNAUTHORIZED;
        case 404:
          return ERROR_MESSAGES.NOT_FOUND;
        case 408:
          return ERROR_MESSAGES.TIMEOUT_ERROR;
        case 429:
          return ERROR_MESSAGES.RATE_LIMIT;
        default:
          if (err.status >= 500) {
            return ERROR_MESSAGES.SERVER_ERROR;
          }
      }
    }

    if (err?.message) {
      if (err.message.includes('network') || err.message.includes('fetch')) {
        return ERROR_MESSAGES.NETWORK_ERROR;
      }
      if (err.message.includes('timeout')) {
        return ERROR_MESSAGES.TIMEOUT_ERROR;
      }
      return err.message;
    }

    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }, []);

  /**
   * Handle error
   */
  const handleError = useCallback((err, context = {}) => {
    errorLogger.error('Error handled', err, context);

    const errorObj = {
      message: getErrorMessage(err),
      originalError: err,
      context,
      timestamp: Date.now(),
    };

    setError(errorObj);

    // Show toast if enabled
    if (showToast) {
      showErrorToast(errorObj.message);
    }

    // Call custom error handler
    if (onError) {
      onError(errorObj);
    }

    return errorObj;
  }, [getErrorMessage, onError, showToast]);

  /**
   * Retry with exponential backoff
   */
  const retry = useCallback(async (fn) => {
    if (retryCount >= maxRetries) {
      errorLogger.warn(`Max retries (${maxRetries}) reached`);
      return null;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
      errorLogger.info(`Retrying after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const result = await fn();
      
      // Success - reset error state
      setError(null);
      setRetryCount(0);
      setIsRetrying(false);
      
      return result;
    } catch (err) {
      setIsRetrying(false);
      handleError(err, { retry: true, attempt: retryCount + 1 });
      throw err;
    }
  }, [retryCount, maxRetries, handleError]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  /**
   * Reset retry count
   */
  const resetRetries = useCallback(() => {
    setRetryCount(0);
  }, []);

  /**
   * Check if online
   */
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useCallback(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (error?.message === ERROR_MESSAGES.NETWORK_ERROR) {
        clearError();
        if (showToast) {
          showSuccessToast('Connection restored');
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      handleError(new Error(ERROR_MESSAGES.NETWORK_ERROR));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error, clearError, handleError, showToast]);

  return {
    error,
    hasError: error !== null,
    errorMessage: error?.message || null,
    retryCount,
    isRetrying,
    canRetry: retryCount < maxRetries,
    isOnline,
    handleError,
    retry,
    clearError,
    resetRetries,
  };
}

/**
 * Toast notification helpers
 * Simple implementation - can be replaced with a toast library
 */
let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

function showToast(message, type = 'error') {
  const container = getToastContainer();
  const toast = document.createElement('div');
  
  const colors = {
    error: '#EA3943',
    success: '#16C784',
    warning: '#F7931A',
    info: '#3772FF',
  };

  toast.style.cssText = `
    background-color: ${colors[type]};
    color: white;
    padding: 12px 24px;
    border-radius: 6px;
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    pointer-events: auto;
    animation: slideIn 0.3s ease-out;
    max-width: 400px;
    word-wrap: break-word;
  `;
  
  toast.textContent = message;
  container.appendChild(toast);

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      container.removeChild(toast);
    }, 300);
  }, 5000);
}

function showErrorToast(message) {
  showToast(message, 'error');
}

function showSuccessToast(message) {
  showToast(message, 'success');
}

function showWarningToast(message) {
  showToast(message, 'warning');
}

function showInfoToast(message) {
  showToast(message, 'info');
}

// Add toast animations to document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

export { showErrorToast, showSuccessToast, showWarningToast, showInfoToast };
export default useErrorHandler;
