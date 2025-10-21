import React from 'react';

// Professional loading spinner component similar to major platforms
function LoadingSpinner({ size = 'medium', fullScreen = false }) {
  const sizes = {
    small: { spinner: '24px', border: '3px' },
    medium: { spinner: '40px', border: '4px' },
    large: { spinner: '60px', border: '5px' }
  };

  const { spinner, border } = sizes[size];

  const spinnerStyle = {
    width: spinner,
    height: spinner,
    border: `${border} solid #333`,
    borderTop: `${border} solid #00b3ff`,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  };

  const containerStyle = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f0f0f',
    zIndex: 9999
  } : {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem'
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          .loading-dots {
            display: inline-flex;
            gap: 4px;
            margin-left: 4px;
          }

          .loading-dots span {
            width: 6px;
            height: 6px;
            background-color: #00b3ff;
            border-radius: 50%;
            animation: pulse 1.4s ease-in-out infinite;
          }

          .loading-dots span:nth-child(1) {
            animation-delay: 0s;
          }

          .loading-dots span:nth-child(2) {
            animation-delay: 0.2s;
          }

          .loading-dots span:nth-child(3) {
            animation-delay: 0.4s;
          }
        `}
      </style>
      <div style={containerStyle}>
        <div style={spinnerStyle}></div>
        <div style={{ 
          marginTop: '1.5rem', 
          color: '#888',
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center'
        }}>
          Loading data
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </>
  );
}

// Skeleton loader for cards (like LinkedIn, Facebook)
export function SkeletonCard() {
  return (
    <>
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }

          .skeleton {
            background: linear-gradient(
              90deg,
              #1a1a1a 0%,
              #252525 50%,
              #1a1a1a 100%
            );
            background-size: 1000px 100%;
            animation: shimmer 2s infinite;
          }
        `}
      </style>
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <div className="skeleton" style={{
          height: '12px',
          width: '60%',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}></div>
        <div className="skeleton" style={{
          height: '32px',
          width: '80%',
          borderRadius: '4px'
        }}></div>
      </div>
    </>
  );
}

// Skeleton loader for charts
export function SkeletonChart({ height = '300px' }) {
  return (
    <>
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }

          .skeleton {
            background: linear-gradient(
              90deg,
              #1a1a1a 0%,
              #252525 50%,
              #1a1a1a 100%
            );
            background-size: 1000px 100%;
            animation: shimmer 2s infinite;
          }
        `}
      </style>
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <div className="skeleton" style={{
          height: '16px',
          width: '40%',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}></div>
        <div className="skeleton" style={{
          height: height,
          width: '100%',
          borderRadius: '8px'
        }}></div>
      </div>
    </>
  );
}

export default LoadingSpinner;
