/**
 * Skeleton Component - Smart loading placeholders
 */

import React from 'react';
import { colors, borderRadius, spacing } from '../../styles/designSystem';

const Skeleton = ({
  width = '100%',
  height = '1rem',
  variant = 'text',
  animation = 'pulse',
  className = '',
  style = {},
  count = 1,
  spacing: spacingProp = 'sm',
}) => {
  const variants = {
    text: { height: '1rem', borderRadius: '4px' },
    title: { height: '1.5rem', borderRadius: '6px' },
    card: { height: '200px', borderRadius: borderRadius.lg },
    circle: { borderRadius: '50%', width: height, height },
    button: { height: '2.5rem', borderRadius: borderRadius.md },
    chart: { height: '300px', borderRadius: borderRadius.md },
  };

  const baseStyle = {
    display: 'block',
    width,
    height,
    backgroundColor: colors.bgTertiary,
    backgroundImage: animation === 'wave' 
      ? `linear-gradient(90deg, ${colors.bgTertiary} 0%, ${colors.cardBorder} 50%, ${colors.bgTertiary} 100%)`
      : 'none',
    backgroundSize: animation === 'wave' ? '200% 100%' : 'auto',
    borderRadius: borderRadius.sm,
    ...variants[variant],
    ...style,
  };

  const animationStyle = {
    animation: animation === 'pulse' 
      ? 'skeleton-pulse 1.5s ease-in-out infinite'
      : 'skeleton-wave 1.5s ease-in-out infinite',
  };

  const spacingValues = {
    none: '0',
    xs: spacing.xs,
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
  };

  const skeletons = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={`skeleton ${className}`}
      style={{
        ...baseStyle,
        ...animationStyle,
        marginBottom: index < count - 1 ? spacingValues[spacingProp] : 0,
      }}
    />
  ));

  return count === 1 ? skeletons[0] : <div>{skeletons}</div>;
};

// Specialized skeleton components
export const SkeletonCard = ({ children, loading, ...props }) => {
  if (!loading) return children;
  
  return (
    <div style={{ padding: spacing.md }}>
      <Skeleton variant="title" width="60%" style={{ marginBottom: spacing.md }} />
      <Skeleton count={3} spacing="sm" {...props} />
    </div>
  );
};

export const SkeletonChart = ({ children, loading, height = '300px' }) => {
  if (!loading) return children;
  
  return (
    <div>
      <Skeleton variant="title" width="40%" style={{ marginBottom: spacing.md }} />
      <Skeleton variant="chart" height={height} />
    </div>
  );
};

export const SkeletonTable = ({ children, loading, rows = 5 }) => {
  if (!loading) return children;
  
  return (
    <div>
      <Skeleton variant="text" height="2rem" style={{ marginBottom: spacing.md }} />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ 
          display: 'flex', 
          gap: spacing.md, 
          marginBottom: spacing.sm 
        }}>
          <Skeleton width="30%" />
          <Skeleton width="40%" />
          <Skeleton width="30%" />
        </div>
      ))}
    </div>
  );
};

// Add keyframe animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes skeleton-pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
    
    @keyframes skeleton-wave {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `;
  if (!document.getElementById('skeleton-styles')) {
    style.id = 'skeleton-styles';
    document.head.appendChild(style);
  }
}

export default Skeleton;
