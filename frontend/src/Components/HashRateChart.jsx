import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { useDataFetch } from '../hooks/useDataFetch';
import { metricsApi } from '../services/apiClient';
import { createLineChart, formatLargeNumber } from '../utils/chartFactory';
import { Card, LoadingSpinner, EmptyState } from './ui';
import { colors } from '../styles/designSystem';
import styles from './HashRateChart.module.css';

/**
 * Hash Rate Chart Component - Refactored
 * Shows hash rate vs BTC price correlation
 * 
 * Features:
 * - useDataFetch hook for smart polling
 * - chartFactory for consistent styling
 * - Design system tokens for colors
 * - CSS modules for styling
 */
const HashRateChart = ({ data: propData }) => {
  const [timeRange, setTimeRange] = useState('30d');

  // Fetch data with smart polling (5min interval for historical data)
  // Only fetch if no prop data is provided
  const { 
    data: fetchedData, 
    loading, 
    error, 
    refetch 
  } = useDataFetch(
    // Pass timespan as a query param object so backend can honor 7d/30d/90d/1y/all
    () => metricsApi.getHashrateHistory({ timespan: timeRange }),
    {
      interval: 5 * 60 * 1000, // 5 minutes
      enabled: !propData || (Array.isArray(propData) && propData.length === 0), // Only fetch if not provided via props
      priority: 'tertiary',
      // Refetch whenever the selected time range changes
      dependencies: [timeRange],
    }
  );

  // ALWAYS prioritize prop data over fetched data
  const data = (propData && propData.length > 0) ? propData : (fetchedData || []);
  const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365, 'all': null };
  const cutoff = daysMap[timeRange] ? Date.now() - daysMap[timeRange] * 24 * 60 * 60 * 1000 : 0;
  const visibleData = (Array.isArray(data) ? data : []).filter(item => !daysMap[timeRange] || item.timestamp >= cutoff);

  // Time range options
  const timeRanges = [
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' },
    { label: '1Y', value: '1y' },
    { label: 'ALL', value: 'all' }
  ];

  // Format data for chart
  const formatChartData = () => {
    if (!visibleData || visibleData.length === 0) {
      return { labels: [], datasets: [] };
    }

    const samplingRate = Math.max(1, Math.floor(visibleData.length / 200));
    const sampledData = visibleData.filter((_, index) => index % samplingRate === 0);

    const labels = sampledData.map(item => {
      const date = new Date(item.timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? '2-digit' : undefined
      });
    });

    return {
      labels,
      datasets: [
        {
          label: 'Hash Rate (TH/s)',
          data: sampledData.map(item => item.hashrate),
          borderColor: colors.success,
          backgroundColor: colors.success + '20',
          yAxisID: 'y',
          tension: 0.4,
          pointRadius: 1,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
        {
          label: 'BTC Price (USD)',
          data: sampledData.map(item => item.price),
          borderColor: colors.primary,
          backgroundColor: colors.primary + '20',
          yAxisID: 'y1',
          tension: 0.4,
          pointRadius: 1,
          pointHoverRadius: 5,
          borderWidth: 2,
        }
      ]
    };
  };

  // Get formatted chart data
  const chartData = formatChartData();

  // Create chart configuration using chartFactory
  const chartConfig = createLineChart(chartData.datasets, chartData.labels, {
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
        // Ensure both datasets are visible by default
        display: true,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            
            if (context.datasetIndex === 0) {
              // Hash rate
              label += formatLargeNumber(context.parsed.y) + ' TH/s';
            } else {
              // Price
              label += '$' + formatLargeNumber(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Hash Rate (TH/s)',
          color: colors.success,
        },
        ticks: {
          color: colors.success,
          callback: (value) => formatLargeNumber(value)
        },
        grid: {
          color: colors.success + '1A' // 10% opacity
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'BTC Price (USD)',
          color: colors.primary,
        },
        ticks: {
          color: colors.primary,
          callback: (value) => '$' + formatLargeNumber(value)
        },
        grid: {
          drawOnChartArea: false
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            
            if (context.datasetIndex === 0) {
              // Hash rate
              label += formatLargeNumber(context.parsed.y) + ' TH/s';
            } else {
              // Price
              label += '$' + formatLargeNumber(context.parsed.y);
            }
            return label;
          }
        }
      }
    }
  });

  return (
    <Card className={styles.container}>
      {/* Header with time range selector */}
      <div className={styles.header}>
        <h3 className={styles.title}>Hash Rate vs BTC Price</h3>
        <div className={styles.timeRangeButtons}>
          {timeRanges.map(range => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`${styles.timeRangeButton} ${
                timeRange === range.value ? styles.timeRangeButtonActive : ''
              }`}
              aria-pressed={timeRange === range.value}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart content */}
      <div className={styles.chartContainer}>
        {loading && (
          <div className={styles.centerContent}>
            <LoadingSpinner size="medium" />
            <p>Loading hash rate data...</p>
          </div>
        )}

        {error && !loading && (
          <div className={styles.errorContent}>
            <p>Error: {error.message}</p>
            <button onClick={refetch} className={styles.retryButton}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && visibleData.length === 0 && (
          <EmptyState 
            message="No hash rate data available"
            icon="⛏️"
            action={refetch}
            actionLabel="Refresh Data"
          />
        )}

        {!loading && !error && visibleData.length > 0 && chartData.datasets.length > 0 && (
          <Line key={timeRange} data={chartConfig.data} options={chartConfig.options} />
        )}
      </div>
    </Card>
  );
};

export default HashRateChart;
