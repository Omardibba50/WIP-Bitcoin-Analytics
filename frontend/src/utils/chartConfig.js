import { colors } from '../styles/designSystem';

/**
 * Standard chart configuration for consistent styling across all charts
 */
export const getChartOptions = (type = 'line', customOptions = {}) => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: colors.textPrimary,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: colors.cardBg,
        titleColor: colors.textPrimary,
        bodyColor: colors.textSecondary,
        borderColor: colors.cardBorder,
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        ticks: {
          color: colors.textSecondary,
          font: {
            size: 11
          }
        },
        grid: {
          color: colors.cardBorder,
          drawBorder: false
        }
      },
      y: {
        ticks: {
          color: colors.textSecondary,
          font: {
            size: 11
          }
        },
        grid: {
          color: colors.cardBorder,
          drawBorder: false
        }
      }
    }
  };

  // Merge with custom options
  return deepMerge(baseOptions, customOptions);
};

/**
 * Chart colors palette for datasets
 */
export const chartColors = {
  primary: colors.accent,
  success: colors.success,
  error: colors.error,
  warning: colors.warning,
  info: colors.info,
  purple: '#a855f7',
  pink: '#ec4899',
  orange: '#f97316',
  teal: '#14b8a6',
  gold: '#FFD700'
};

/**
 * Get gradient for charts
 */
export const getChartGradient = (ctx, color1, color2 = null) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2 || `${color1}40`);
  return gradient;
};

/**
 * Standard dataset configuration
 */
export const getDatasetConfig = (label, data, color = chartColors.primary, options = {}) => {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: `${color}40`,
    borderWidth: 2,
    fill: false,
    tension: 0.4,
    pointRadius: 3,
    pointHoverRadius: 5,
    pointBackgroundColor: color,
    pointBorderColor: colors.textPrimary,
    pointBorderWidth: 1,
    ...options
  };
};

/**
 * Time scale configuration for date-based charts
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
        month: 'MMM yyyy'
      }
    },
    ticks: {
      color: colors.textSecondary,
      font: {
        size: 11
      }
    },
    grid: {
      color: colors.cardBorder,
      drawBorder: false
    }
  };
};

/**
 * Candlestick chart configuration
 */
export const getCandlestickConfig = () => {
  return {
    borderColor: colors.accent,
    color: {
      up: colors.success,
      down: colors.error,
      unchanged: colors.textMuted
    }
  };
};

/**
 * Deep merge utility for nested objects
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
