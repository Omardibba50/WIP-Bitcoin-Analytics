/**
 * LoadingSpinner Component - Branded loading indicator
 * Uses CSS variables from design system
 */

import React from 'react';

const LoadingSpinner = ({
  size = 'md',
  color = 'var(--color-primary)',
  text,
  fullscreen = false,
  className = '',
  style = {},
}) => {
  const sizes = {
    xs: 16,
    sm: 24,
    md: 40,
    lg: 60,
    xl: 80,
  };

  const spinnerSize = sizes[size] || sizes.md;

  const spinnerStyle = {
    width: spinnerSize,
    height: spinnerSize,
    border: '3px solid var(--color-surface-default)',
    borderTop: `3px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    ...(fullscreen && {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(10, 10, 10, 0.95)',
      backdropFilter: 'blur(8px)',
      zIndex: 'var(--z-index-modal)',
    }),
    ...style,
  };

  return (
    <div className={`loading-spinner ${className}`} style={containerStyle}>
      <div style={spinnerStyle} />
      {text && (
        <p style={{
          margin: 0,
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-size-base)',
          fontWeight: 'var(--font-weight-medium)',
        }}>
          {text}
        </p>
      )}
    </div>
  );
};

// Bitcoin-themed spinner variant
export const BitcoinSpinner = ({
  size = 'md',
  text,
  fullscreen = false,
  className = '',
  style = {},
}) => {
  const sizes = {
    xs: 16,
    sm: 24,
    md: 40,
    lg: 60,
    xl: 80,
  };

  const spinnerSize = sizes[size] || sizes.md;

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    ...(fullscreen && {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(10, 10, 10, 0.95)',
      backdropFilter: 'blur(8px)',
      zIndex: 'var(--z-index-modal)',
    }),
    ...style,
  };

  return (
    <div className={`bitcoin-spinner ${className}`} style={containerStyle}>
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          fontSize: spinnerSize * 0.6,
          animation: 'spin 1.5s linear infinite',
          color: 'var(--color-primary)',
        }}
      >
        ₿
      </div>
      {text && (
        <p style={{
          margin: 0,
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-size-base)',
          fontWeight: 'var(--font-weight-medium)',
        }}>
          {text}
        </p>
      )}
    </div>
  );
};

// Dots loader variant
export const DotsLoader = ({
  color = 'var(--color-primary)',
  size = 'md',
  className = '',
  style = {},
}) => {
  const sizes = {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 10,
    xl: 12,
  };

  const dotSize = sizes[size] || sizes.md;

  const dotStyle = {
    width: dotSize,
    height: dotSize,
    borderRadius: '50%',
    backgroundColor: color,
  };

  return (
    <div
      className={`dots-loader ${className}`}
      style={{
        display: 'flex',
        gap: dotSize,
        ...style,
      }}
    >
      <div style={{ ...dotStyle, animation: 'dot-pulse 1.4s ease-in-out 0s infinite' }} />
      <div style={{ ...dotStyle, animation: 'dot-pulse 1.4s ease-in-out 0.2s infinite' }} />
      <div style={{ ...dotStyle, animation: 'dot-pulse 1.4s ease-in-out 0.4s infinite' }} />
    </div>
  );
};

// Progress bar loader
export const ProgressBar = ({
  progress = 0,
  showPercentage = true,
  color = 'var(--color-primary)',
  height = 8,
  className = '',
  style = {},
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`progress-bar ${className}`} style={{ width: '100%', ...style }}>
      {showPercentage && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 'var(--spacing-sm)',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-secondary)',
        }}>
          <span>Loading...</span>
          <span>{Math.round(clampedProgress)}%</span>
        </div>
      )}
      <div style={{
        width: '100%',
        height,
        backgroundColor: 'var(--color-surface-default)',
        borderRadius: height / 2,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${clampedProgress}%`,
          height: '100%',
          backgroundColor: color,
          transition: 'width 0.3s ease',
          borderRadius: height / 2,
        }} />
      </div>
    </div>
  );
};

// Add keyframe animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    
    @keyframes dot-pulse {
      0%, 80%, 100% {
        opacity: 0.3;
        transform: scale(0.8);
      }
      40% {
        opacity: 1;
        transform: scale(1);
      }
    }
  `;
  if (!document.getElementById('loading-spinner-styles')) {
    style.id = 'loading-spinner-styles';
    document.head.appendChild(style);
  }
}

export default LoadingSpinner;
export { LoadingSpinner };
