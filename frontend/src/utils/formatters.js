/**
 * Formatting utility functions
 */

/**
 * Format currency values
 */
export function formatCurrency(value, options = {}) {
  const {
    currency = 'USD',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    locale = 'en-US',
  } = options;

  const val = Number(value);
  if (!Number.isFinite(val)) return '—';

  const min = Number.isFinite(minimumFractionDigits) ? Math.min(Math.max(minimumFractionDigits, 0), 20) : 2;
  const max = Number.isFinite(maximumFractionDigits) ? Math.min(Math.max(maximumFractionDigits, min), 20) : Math.max(min, 2);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  }).format(val);
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatNumber(num, decimals = 2) {
  const n = Number(num);
  if (!Number.isFinite(n)) return '—';
  if (n >= 1000000000) return `${(n / 1000000000).toFixed(decimals)}B`;
  if (n >= 1000000) return `${(n / 1000000).toFixed(decimals)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(decimals)}K`;
  return n.toFixed(decimals);
}

/**
 * Format percentage
 */
export function formatPercentage(value, decimals = 2) {
  const v = Number(value);
  if (!Number.isFinite(v)) return '—';
  const formatted = (v * 100).toFixed(decimals);
  return `${v >= 0 ? '+' : ''}${formatted}%`;
}

/**
 * Format date
 */
export function formatDate(timestamp, options = {}) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options
  });
}

/**
 * Format time ago
 */
export function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Format file size
 */
export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
