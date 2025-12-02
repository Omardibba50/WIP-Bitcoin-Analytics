/**
 * Card Component - Consistent styled wrapper
 * Uses CSS variables from design system
 */

import React from 'react';

const Card = ({
  children,
  title,
  subtitle,
  className = '',
  style = {},
  onClick,
  hover = false,
  glow = false,
  padding = 'md',
  ...props
}) => {
  const paddingMap = {
    none: '0',
    sm: 'var(--spacing-md)',
    md: 'var(--spacing-xl)',
    lg: 'var(--spacing-2xl)',
    xl: 'var(--spacing-3xl)',
  };

  const baseStyle = {
    background: 'var(--card-bg)',
    backdropFilter: 'blur(20px)',
    borderRadius: 'var(--card-radius)',
    border: '1px solid var(--card-border)',
    boxShadow: glow ? 'var(--shadow-glow)' : 'var(--card-shadow)',
    padding: paddingMap[padding] || paddingMap.md,
    transition: 'all var(--transition-base)',
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  };

  const handleMouseEnter = (e) => {
    if (hover || onClick) {
      e.currentTarget.style.borderColor = 'var(--card-border-hover)';
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = 'var(--card-shadow-hover)';
    }
  };

  const handleMouseLeave = (e) => {
    if (hover || onClick) {
      e.currentTarget.style.borderColor = 'var(--card-border)';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = glow ? 'var(--shadow-glow)' : 'var(--card-shadow)';
    }
  };

  return (
    <div
      className={`card ${className}`}
      style={baseStyle}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {(title || subtitle) && (
        <div style={{
          marginBottom: 'var(--spacing-lg)',
          borderBottom: '1px solid var(--color-border-subtle)',
          paddingBottom: 'var(--spacing-md)',
        }}>
          {title && (
            <h3 style={{
              margin: 0,
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
            }}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p style={{
              margin: title ? 'var(--spacing-sm) 0 0' : 0,
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
            }}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
