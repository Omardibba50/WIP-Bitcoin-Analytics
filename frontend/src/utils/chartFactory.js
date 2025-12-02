/**
 * Chart Factory - Unified chart configuration and utilities
 * Consolidates chartUtils.js and chartConfig.js with theme-aware presets
 */

import { colors, spacing } from '../styles/designSystem';

/**
 * Chart Colors Palette
 */
export const chartColors = {
  primary: colors.primary || '#00b3ff',
  success: colors.success || '#10b981',
  error: colors.error || '#ef4444',
  warning: colors.warning || '#f59e0b',
  info: colors.info || '#3b82f6',
  bitcoin: '#F7931A',
  purple: '#a855f7',
  pink: '#ec4899',
  orange: '#f97316',
  teal: '#14b8a6',
  gold: '#FFD700',
  silver: '#C0C0C0',
};

/**
 * Base Chart Options - Theme-aware defaults
 */
export const getBaseChartOptions = (customOptions = {}) => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: colors.textPrimary,
          font: {
            size: 12,
            weight: '500',
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
          padding: 12,
          usePointStyle: true,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: colors.cardBg || 'rgba(26, 26, 26, 0.95)',
        titleColor: colors.textPrimary,
        bodyColor: colors.textSecondary,
        borderColor: colors.cardBorder || 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }

            const y = context && context.parsed ? context.parsed.y : undefined;
            if (typeof y === 'number' && Number.isFinite(y)) {
              label += y.toLocaleString();
            } else if (y != null) {
              // Fallback string conversion for non-numeric but defined values
              label += String(y);
            }

            return label;
          }
        }
      },
    },
    scales: {
      x: {
        ticks: {
          color: colors.textSecondary,
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 0,
        },
        grid: {
          color: colors.cardBorder || 'rgba(255, 255, 255, 0.08)',
          drawBorder: false,
          drawTicks: false,
        },
      },
      y: {
        ticks: {
          color: colors.textSecondary,
          font: {
            size: 11,
          },
          callback: function(value) {
            if (typeof value === 'number' && Number.isFinite(value)) {
              return value.toLocaleString();
            }
            return String(value ?? '');
          },
        },
        grid: {
          color: colors.cardBorder || 'rgba(255, 255, 255, 0.08)',
          drawBorder: false,
          drawTicks: false,
        },
      },
    },
  };

  return deepMerge(baseOptions, customOptions);
};

/**
 * Create Line Chart Configuration
 */
export const createLineChart = (datasets, labels, options = {}) => {
  // Validate datasets is an array
  if (!Array.isArray(datasets)) {
    console.error('createLineChart: datasets must be an array, received:', datasets);
    return {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: getBaseChartOptions(options),
    };
  }

  const chartOptions = getBaseChartOptions({
    ...options,
    plugins: {
      ...options.plugins,
    },
  });

  return {
    type: 'line',
    data: {
      labels,
      datasets: datasets.map(dataset => ({
        fill: false,
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
        pointBorderWidth: 1,
        pointBackgroundColor: dataset.borderColor || chartColors.primary,
        pointBorderColor: colors.textPrimary,
        ...dataset,
      })),
    },
    options: chartOptions,
  };
};

/**
 * Create Bar Chart Configuration
 */
export const createBarChart = (datasets, labels, options = {}) => {
  // Validate datasets is an array
  if (!Array.isArray(datasets)) {
    console.error('createBarChart: datasets must be an array, received:', {
      datasets,
      type: typeof datasets,
      isArray: Array.isArray(datasets)
    });
    return {
      type: 'bar',
      data: { labels: labels || [], datasets: [] },
      options: getBaseChartOptions(options),
    };
  }

  // Validate labels
  if (!Array.isArray(labels)) {
    console.warn('createBarChart: labels should be an array, received:', {
      labels,
      type: typeof labels
    });
  }

  const chartOptions = getBaseChartOptions({
    ...options,
    plugins: {
      ...options.plugins,
    },
  });

  try {
    return {
      type: 'bar',
      data: {
        labels: labels || [],
        datasets: datasets.map(dataset => ({
          borderWidth: 0,
          borderRadius: 4,
          ...dataset,
        })),
      },
      options: chartOptions,
    };
  } catch (err) {
    console.error('createBarChart: Error during chart creation:', err);
    return {
      type: 'bar',
      data: { labels: labels || [], datasets: [] },
      options: chartOptions,
    };
  }
};

/**
 * Create Candlestick Chart Configuration
 */
export const createCandlestickChart = (data, options = {}) => {
  const chartOptions = getBaseChartOptions({
    ...options,
    plugins: {
      ...options.plugins,
    },
  });

  return {
    type: 'candlestick',
    data: {
      datasets: [{
        label: 'OHLC',
        data,
        borderColor: chartColors.primary,
        color: {
          up: chartColors.success,
          down: chartColors.error,
          unchanged: colors.textMuted,
        },
        ...options.dataset,
      }],
    },
    options: chartOptions,
  };
};

/**
 * Create Doughnut Chart Configuration
 */
export const createDoughnutChart = (labels, data, options = {}) => {
  const chartOptions = getBaseChartOptions({
    ...options,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
      },
      ...options.plugins,
    },
  });

  return {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: [
          chartColors.primary,
          chartColors.success,
          chartColors.warning,
          chartColors.error,
          chartColors.info,
          chartColors.secondary,
        ],
        borderWidth: 2,
        borderColor: colors.cardBg,
        ...options.dataset,
      }],
    },
    options: chartOptions,
  };
};

/**
 * Create Area Chart Configuration (filled line chart)
 */
export const createAreaChart = (datasets, labels, options = {}) => {
  // Validate datasets is an array
  if (!Array.isArray(datasets)) {
    console.error('createAreaChart: datasets must be an array, received:', datasets);
    return {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: getBaseChartOptions(options),
    };
  }

  const chartOptions = getBaseChartOptions(options);

  return {
    type: 'line',
    data: {
      labels,
      datasets: datasets.map(dataset => ({
        fill: true,
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        backgroundColor: dataset.backgroundColor || `${dataset.borderColor || chartColors.primary}40`,
        ...dataset,
      })),
    },
    options: chartOptions,
  };
};

/**
 * Get gradient for charts
 */
export const createGradient = (ctx, color1, color2 = null, direction = 'vertical') => {
  if (!ctx) return color1;
  
  const gradient = direction === 'vertical'
    ? ctx.createLinearGradient(0, 0, 0, 400)
    : ctx.createLinearGradient(0, 0, 400, 0);
  
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2 || `${color1}40`);
  
  return gradient;
};

/**
 * Time Scale Configuration for date-based charts
 */
export const getTimeScaleConfig = (unit = 'day') => {
  return {
    type: 'time',
    time: {
      unit,
      tooltipFormat: 'MMM dd, yyyy HH:mm',
      displayFormats: {
        hour: 'HH:mm',
        day: 'MMM dd',
        week: 'MMM dd',
        month: 'MMM yyyy',
      },
    },
    ticks: {
      color: colors.textSecondary,
      font: {
        size: 11,
      },
      maxRotation: 45,
      minRotation: 0,
    },
    grid: {
      color: colors.cardBorder || 'rgba(255, 255, 255, 0.08)',
      drawBorder: false,
    },
  };
};

/**
 * Format Price History Data for Chart
 */
export function formatPriceHistoryForChart(priceHistory, sampleRate = 6) {
  if (!priceHistory || priceHistory.length === 0) {
    return {
      labels: ['No Data'],
      datasets: [{
        label: 'BTC Price',
        data: [0],
        borderColor: chartColors.bitcoin,
      }],
    };
  }

  const sortedHistory = [...priceHistory].sort((a, b) => a.ts - b.ts);
  const sampledData = sampleRate > 1 
    ? sortedHistory.filter((_, index) => index % sampleRate === 0)
    : sortedHistory;
  
  const labels = sampledData.map(item => {
    const date = new Date(item.ts);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? '2-digit' : undefined,
    });
  });
  
  const data = sampledData.map(item => item.price);

  return {
    labels,
    datasets: [{
      label: 'BTC Price',
      data,
      borderColor: chartColors.bitcoin,
      backgroundColor: `${chartColors.bitcoin}40`,
    }],
  };
}

/**
 * Format Models Data for Bar Chart
 */
export function formatModelsForChart(models) {
  if (!models || models.length === 0) {
    return {
      labels: ['No Models'],
      datasets: [{
        label: 'Models',
        data: [0],
        backgroundColor: chartColors.primary,
      }],
    };
  }

  const labels = models.map(model => model.name || 'Unknown');
  const data = models.map(model => model.accuracy || 0);

  return {
    labels,
    datasets: [{
      label: 'Model Accuracy',
      data,
      backgroundColor: chartColors.success,
      borderColor: chartColors.success,
    }],
  };
}

/**
 * Format Treasury Data for Chart
 */
export function formatTreasuryDataForChart(treasuries) {
  if (!treasuries || treasuries.length === 0) {
    return {
      labels: ['No Data'],
      datasets: [{
        label: 'Holdings',
        data: [0],
        backgroundColor: chartColors.bitcoin,
      }],
    };
  }

  const sortedTreasuries = [...treasuries].sort((a, b) => b.holdings - a.holdings);
  const top10 = sortedTreasuries.slice(0, 10);
  
  const labels = top10.map(t => t.name || t.entity);
  const data = top10.map(t => t.holdings);

  return {
    labels,
    datasets: [{
      label: 'BTC Holdings',
      data,
      backgroundColor: chartColors.bitcoin,
      borderColor: chartColors.bitcoin,
    }],
  };
}

/**
 * Format Hashrate History for Chart
 */
export function formatHashrateForChart(hashrateData) {
  if (!hashrateData || hashrateData.length === 0) {
    return {
      labels: ['No Data'],
      datasets: [{
        label: 'Hashrate',
        data: [0],
        borderColor: chartColors.primary,
      }],
    };
  }

  const sortedData = [...hashrateData].sort((a, b) => a.timestamp - b.timestamp);
  
  const labels = sortedData.map(item => {
    const date = new Date(item.timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  
  const data = sortedData.map(item => item.hashrate || item.value);

  return {
    labels,
    datasets: [{
      label: 'Network Hashrate (EH/s)',
      data,
      borderColor: chartColors.primary,
      backgroundColor: `${chartColors.primary}40`,
    }],
  };
}

/**
 * Format Difficulty History for Chart
 */
export function formatDifficultyForChart(difficultyData) {
  if (!difficultyData || difficultyData.length === 0) {
    return {
      labels: ['No Data'],
      datasets: [{
        label: 'Difficulty',
        data: [0],
        borderColor: chartColors.warning,
      }],
    };
  }

  const sortedData = [...difficultyData].sort((a, b) => a.timestamp - b.timestamp);
  
  const labels = sortedData.map(item => {
    const date = new Date(item.timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  
  const data = sortedData.map(item => item.difficulty || item.value);

  return {
    labels,
    datasets: [{
      label: 'Mining Difficulty',
      data,
      borderColor: chartColors.warning,
      backgroundColor: `${chartColors.warning}40`,
    }],
  };
}

/**
 * Format Currency for Display
 */
export function formatCurrency(value, currency = 'USD', decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format Large Numbers (K, M, B, T)
 */
export function formatLargeNumber(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  
  const absValue = Math.abs(value);
  
  if (absValue >= 1e12) {
    return (value / 1e12).toFixed(decimals) + 'T';
  } else if (absValue >= 1e9) {
    return (value / 1e9).toFixed(decimals) + 'B';
  } else if (absValue >= 1e6) {
    return (value / 1e6).toFixed(decimals) + 'M';
  } else if (absValue >= 1e3) {
    return (value / 1e3).toFixed(decimals) + 'K';
  }
  
  return value.toFixed(decimals);
}

/**
 * Format Percentage
 */
export function formatPercentage(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  
  const sign = value >= 0 ? '+' : '';
  return sign + value.toFixed(decimals) + '%';
}

/**
 * Deep Merge Utility for Nested Objects
 */
function deepMerge(target, source) {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Export all utilities
 */
export default {
  // Chart creators
  createLineChart,
  createBarChart,
  createCandlestickChart,
  createAreaChart,
  
  // Configuration helpers
  getBaseChartOptions,
  getTimeScaleConfig,
  createGradient,
  
  // Data formatters
  formatPriceHistoryForChart,
  formatModelsForChart,
  formatTreasuryDataForChart,
  formatHashrateForChart,
  formatDifficultyForChart,
  
  // Value formatters
  formatCurrency,
  formatLargeNumber,
  formatPercentage,
  
  // Constants
  chartColors,
};
