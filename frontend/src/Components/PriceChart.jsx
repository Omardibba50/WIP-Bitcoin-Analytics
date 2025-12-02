import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { createLineChart, formatPriceHistoryForChart } from '../utils/chartFactory';
import { Card, LoadingSpinner } from '../components/ui';
import { colors } from '../styles/designSystem';
import styles from './PriceChart.module.css';

/**
 * Price Chart Component - Refactored
 * Displays price history with time range selector
 * 
 * @param {Array} priceHistory - Price data array
 * @param {boolean} loading - Loading state
 * @param {Function} onTimeRangeChange - Callback for time range changes
 */
function PriceChart({ priceHistory, loading, onTimeRangeChange }) {
  const [timeRange, setTimeRange] = useState('30d');
  
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    if (onTimeRangeChange) {
      onTimeRangeChange(range);
    }
  };

  const timeRanges = [
    { label: '7D', value: '7d', days: 7 },
    { label: '30D', value: '30d', days: 30 },
    { label: '90D', value: '90d', days: 90 },
    { label: '1Y', value: '1y', days: 365 },
    { label: 'ALL', value: 'all', days: null }
  ];

  // Format chart data using chartFactory
  const { labels, datasets } = formatPriceHistoryForChart(priceHistory || []);
  
  // Create chart configuration
  const chartConfig = createLineChart(datasets, labels, {
    plugins: {
      title: {
        display: false,
      },
      legend: {
        display: true,
        position: 'top',
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Price (USD)',
        },
      },
    },
  });

  if (loading) {
    return (
      <Card className={styles.container}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="medium" />
          <p>Loading price chart...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Price History</h3>
        <div className={styles.timeRangeButtons}>
          {timeRanges.map(range => (
            <button
              key={range.value}
              onClick={() => handleTimeRangeChange(range.value)}
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
      
      <div className={styles.chartContainer}>
        {datasets && datasets.length > 0 && datasets[0].data.length > 0 ? (
          <Line data={chartConfig.data} options={chartConfig.options} />
        ) : (
          <div className={styles.noData}>
            <p>No price data available</p>
          </div>
        )}
      </div>
    </Card>
  );
}

export default PriceChart;
