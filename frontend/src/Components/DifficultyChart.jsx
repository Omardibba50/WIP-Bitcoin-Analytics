import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { useDataFetch } from '../hooks/useDataFetch';
import { metricsApi } from '../services/apiClient';
import { createLineChart, formatLargeNumber } from '../utils/chartFactory';
import { Card, LoadingSpinner } from '../components/ui';
import { colors } from '../styles/designSystem';
import styles from './DifficultyChart.module.css';

/**
 * Difficulty Chart Component - Refactored
 * Shows mining difficulty vs BTC price correlation
 * 
 * Features:
 * - useDataFetch hook for smart polling
 * - chartFactory for consistent styling
 * - Highlights difficulty adjustments
 * - Design system tokens
 */
const DifficultyChart = ({ data: propData }) => {
  const [timeRange, setTimeRange] = useState('30d');

  // Fetch data with smart polling (5min interval)
  // Only fetch if no prop data is provided
  const { 
    data: fetchedData, 
    loading, 
    error, 
    refetch 
  } = useDataFetch(
    // Pass timespan as a query param so backend can honor 7d/30d/90d/1y/all
    () => metricsApi.getDifficultyHistory({ timespan: timeRange }),
    {
      interval: 5 * 60 * 1000, // 5 minutes
      enabled: !propData || (Array.isArray(propData) && propData.length === 0), // Only fetch if not provided via props
      priority: 'tertiary',
      // Refetch when the selected time range changes
      dependencies: [timeRange],
    }
  );

  // ALWAYS prioritize prop data over fetched data
  const data = (propData && propData.length > 0) ? propData : (fetchedData || []);

  const timeRanges = [
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' },
    { label: '1Y', value: '1y' },
    { label: 'ALL', value: 'all' }
  ];

  // Format data for chart
  const formatChartData = () => {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Sample for performance (max 200 points)
    const samplingRate = Math.max(1, Math.floor(data.length / 200));
    const sampledData = data.filter((_, index) => index % samplingRate === 0);

    const labels = sampledData.map(item => {
      const date = new Date(item.timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? '2-digit' : undefined
      });
    });

    // Find difficulty adjustments (where adjustment_pct is not null)
    const adjustments = sampledData
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.adjustment_pct !== null && Math.abs(item.adjustment_pct) > 1);

    return {
      labels,
      datasets: [
        {
          label: 'Difficulty',
          data: sampledData.map(item => item.difficulty),
          borderColor: colors.warning,
          backgroundColor: colors.warning + '20',
          yAxisID: 'y',
          tension: 0.4,
          pointRadius: sampledData.map((_, index) => {
            // Highlight adjustment points
            return adjustments.some(adj => adj.index === index) ? 4 : 1;
          }),
          pointHoverRadius: 5,
          pointBackgroundColor: sampledData.map((_, index) => {
            const adj = adjustments.find(a => a.index === index);
            if (adj) {
              return adj.item.adjustment_pct > 0 ? colors.success : colors.error;
            }
            return colors.warning;
          }),
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
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Difficulty (T)',
          color: colors.warning,
        },
        ticks: {
          color: colors.warning,
          callback: (value) => (value / 1000000000000).toFixed(1) + 'T'
        },
        grid: {
          color: colors.warning + '1A'
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
              // Difficulty - format in trillions
              const value = context.parsed.y / 1000000000000;
              label += value.toFixed(2) + 'T';
              
              // Add adjustment percentage if available
              const samplingRate = Math.max(1, Math.floor(data.length / 200));
              const dataPoint = data[context.dataIndex * samplingRate];
              if (dataPoint && dataPoint.adjustment_pct !== null) {
                label += ` (${dataPoint.adjustment_pct > 0 ? '+' : ''}${dataPoint.adjustment_pct.toFixed(2)}%)`;
              }
            } else {
              // Price
              label += '$' + formatLargeNumber(context.parsed.y);
            }
            return label;
          }
        }
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          generateLabels: (chart) => {
            const labels = chart.data.datasets.map((dataset, i) => ({
              text: dataset.label,
              fillStyle: dataset.borderColor,
              strokeStyle: dataset.borderColor,
              lineWidth: 2,
              hidden: !chart.isDatasetVisible(i),
              index: i
            }));
            
            // Add legend for adjustment colors
            labels.push(
              {
                text: 'Difficulty ↑ (adjustment)',
                fillStyle: colors.success,
                strokeStyle: colors.success,
                pointStyle: 'circle',
                lineWidth: 0
              },
              {
                text: 'Difficulty ↓ (adjustment)',
                fillStyle: colors.error,
                strokeStyle: colors.error,
                pointStyle: 'circle',
                lineWidth: 0
              }
            );
            
            return labels;
          }
        }
      }
    }
  });

  return (
    <Card className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>Mining Difficulty vs BTC Price</h3>
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
            <p>Loading difficulty data...</p>
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

        {!loading && !error && data.length === 0 && (
          <div className={styles.centerContent}>
            <p>No data available</p>
          </div>
        )}

        {!loading && !error && data.length > 0 && chartData.datasets.length > 0 && (
          <Line data={chartConfig.data} options={chartConfig.options} />
        )}
      </div>
    </Card>
  );
};

export default DifficultyChart;
