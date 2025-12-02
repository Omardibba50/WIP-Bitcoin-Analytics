// Corporate Design System - Refined Gray Theme
export const colors = {
  // Primary - Sophisticated Teal/Cyan
  primary: '#22D3EE',
  primaryDark: '#06B6D4',
  primaryLight: '#67E8F9',
  
  // Background
  bgPrimary: '#0A0A0A',
  bgSecondary: '#0F0F0F',
  bgTertiary: '#141414',
  
  // Cards
  cardBg: 'rgba(30, 30, 30, 0.8)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  cardBorderHover: 'rgba(255, 255, 255, 0.15)',
  
  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  
  // Status
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  
  // Accents
  accent: '#22D3EE',
  accentGradient: 'linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%)',
};

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  xxl: '3rem',
};

export const borderRadius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
};

export const shadows = {
  sm: '0 2px 8px rgba(0, 0, 0, 0.2)',
  md: '0 4px 16px rgba(0, 0, 0, 0.3)',
  lg: '0 8px 32px rgba(0, 0, 0, 0.4)',
  glow: '0 0 20px rgba(0, 179, 255, 0.3)',
};

export const typography = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  
  h1: {
    fontSize: '2rem',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  },
  h2: {
    fontSize: '1.5rem',
    fontWeight: '600',
    letterSpacing: '-0.25px',
  },
  h3: {
    fontSize: '1.25rem',
    fontWeight: '600',
  },
  body: {
    fontSize: '0.95rem',
    fontWeight: '400',
  },
  small: {
    fontSize: '0.85rem',
    fontWeight: '400',
  },
  tiny: {
    fontSize: '0.75rem',
    fontWeight: '400',
  },
};

export const transitions = {
  fast: 'all 0.15s ease',
  normal: 'all 0.25s ease',
  slow: 'all 0.4s ease',
};

// Component Styles
export const cardStyle = {
  background: colors.cardBg,
  backdropFilter: 'blur(10px)',
  borderRadius: borderRadius.lg,
  border: `1px solid ${colors.cardBorder}`,
  boxShadow: shadows.md,
  padding: spacing.xl,
  transition: transitions.normal,
};

export const buttonStyle = {
  base: {
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: borderRadius.md,
    border: 'none',
    fontWeight: '600',
    fontSize: typography.small.fontSize,
    cursor: 'pointer',
    transition: transitions.fast,
  },
  primary: {
    background: colors.accentGradient,
    color: colors.textPrimary,
    boxShadow: shadows.sm,
  },
  secondary: {
    background: 'rgba(255, 255, 255, 0.05)',
    color: colors.textPrimary,
    border: `1px solid ${colors.cardBorder}`,
  },
};

export const inputStyle = {
  base: {
    background: colors.bgTertiary,
    border: `1px solid ${colors.cardBorder}`,
    borderRadius: borderRadius.md,
    padding: `${spacing.sm} ${spacing.md}`,
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    transition: transitions.fast,
  },
};
