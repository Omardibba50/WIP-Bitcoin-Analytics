import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { useDataFetch } from '../hooks/useDataFetch';
import { metricsApi, priceApi } from '../services/apiClient';
import { createLineChart, formatLargeNumber } from '../utils/chartFactory';
import { Card, LoadingSpinner, EmptyState } from './ui';
import { colors } from '../styles/designSystem';
import styles from './BTCGoldChart.module.css';

/**
 * BTC vs Gold Comparison Chart Component
 * Shows Bitcoin price vs Gold price correlation
 * 
 * Features:
 * - Dual Y-axis for BTC (USD) and Gold (oz)
 * - Time range selector
 * - Design system tokens for consistent styling
 */
const BTCGoldChart = () => {
  const [timeRange, setTimeRange] = useState('30d');

  // Fetch BTC price history
  const { 
    data: btcPriceData, 
    loading: btcLoading, 
    error: btcError,
    refetch: refetchBtcPrice
  } = useDataFetch(
    () => {
      const days = getDaysFromRange(timeRange);
      const to = Date.now();
      const from = to - (days * 24 * 60 * 60 * 1000);
      console.log('BTCGoldChart: Fetching price data', { from, to, days });
      const limit = Math.min(Math.ceil((to - from) / (60 * 60 * 1000)), 3000);
      return priceApi.getHistory({ from, to, limit });
    },
    {
      interval: 5 * 60 * 1000, // 5 minutes
      priority: 'tertiary',
      dependencies: [timeRange],
    }
  );

  // Fetch gold metrics (includes current gold price) - optional, won't block chart
  const { 
    data: goldData
  } = useDataFetch(
    () => metricsApi.getGoldMetrics().catch(() => null),
    {
      interval: 5 * 60 * 1000,
      priority: 'tertiary',
      dependencies: [],
      enabled: true,
    }
  );

  const loading = btcLoading;
  const error = btcError;

  const timeRanges = [
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' },
    { label: '1Y', value: '1y' },
    { label: 'ALL', value: 'all' }
  ];

  function getDaysFromRange(range) {
    const map = { '7d': 7, '30d': 30, '90d': 90, '1y': 365, 'all': 1460 };
    return map[range] || 30;
  }

  // Format data for chart
  const formatChartData = () => {
    // btcPriceData is already an array, not { data: [...] }
    if (!btcPriceData || !Array.isArray(btcPriceData) || btcPriceData.length === 0) {
      return { labels: [], datasets: [] };
    }

    const priceHistory = btcPriceData;
    // Use actual gold price if available, otherwise use approximate $2000/oz
    const currentGoldPrice = goldData?.data?.goldPricePerOz || 2000;

    // Sample data for performance (max 200 points)
    const samplingRate = Math.max(1, Math.floor(priceHistory.length / 200));
    const sampledData = priceHistory.filter((_, index) => index % samplingRate === 0);

    const labels = sampledData.map(item => {
      // Handle both timestamp formats (seconds or milliseconds)
      const timestamp = item.timestamp || item.ts;
      const date = new Date(timestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? '2-digit' : undefined
      });
    });

    // Calculate BTC price in gold ounces (using current gold price for all historical BTC prices)
    const btcInGold = sampledData.map(item => item.price / currentGoldPrice);

    return {
      labels,
      datasets: [
        {
          label: 'BTC Price (USD)',
          data: sampledData.map(item => item.price),
          borderColor: colors.primary,
          backgroundColor: colors.primary + '20',
          yAxisID: 'y',
          tension: 0.4,
          pointRadius: 1,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
        {
          label: 'BTC in Gold (oz)',
          data: btcInGold,
          borderColor: colors.warning,
          backgroundColor: colors.warning + '20',
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
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
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
          color: colors.primary + '1A'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'BTC in Gold (oz)',
          color: colors.warning,
        },
        ticks: {
          color: colors.warning,
          callback: (value) => value.toFixed(2) + ' oz'
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
              // BTC Price in USD
              label += '$' + formatLargeNumber(context.parsed.y);
            } else {
              // BTC in Gold ounces
              label += context.parsed.y.toFixed(2) + ' oz';
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
        <h3 className={styles.title}>BTC vs Gold Comparison</h3>
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
            <p>Loading comparison data...</p>
          </div>
        )}

        {error && !loading && (
          <div className={styles.errorContent}>
            <p>Error: {error.message}</p>
          </div>
        )}

        {!loading && !error && (!chartData.datasets || chartData.datasets.length === 0) && (
          <EmptyState 
            message="No BTC/Gold comparison data available"
            icon="📈"
            action={refetchBtcPrice}
            actionLabel="Refresh Data"
          />
        )}

        {!loading && !error && chartData.datasets && chartData.datasets.length > 0 && (
          <Line key={timeRange} data={chartConfig.data} options={chartConfig.options} />
        )}
      </div>
    </Card>
  );
};

export default BTCGoldChart;
