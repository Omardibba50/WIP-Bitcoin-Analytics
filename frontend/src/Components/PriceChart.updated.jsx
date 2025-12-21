import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { createLineChart, formatPriceHistoryForChart } from '../utils/chartFactory';
import ChartWrapper from './ChartWrapper';
import { colors } from '../styles/designSystem';
import styles from './PriceChart.module.css';

/**
 * Price Chart Component - Updated with ChartWrapper
 * Displays price history with time range selector
 * 
 * @param {Array} priceHistory - Price data array
 * @param {boolean} loading - Loading state
 * @param {Function} onTimeRangeChange - Callback for time range changes
 * @param {Function} onRefresh - Manual refresh callback
 */
function PriceChart({ priceHistory, loading: externalLoading, onTimeRangeChange, onRefresh }) {
  const [timeRange, setTimeRange] = useState('30d');
  const [internalLoading, setInternalLoading] = useState(false);
  
  const loading = externalLoading || internalLoading;
  
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    if (onTimeRangeChange) {
      onTimeRangeChange(range);
    }
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      setInternalLoading(true);
      try {
        await onRefresh();
      } finally {
        setInternalLoading(false);
      }
    }
  };

  const timeRanges = [
    { label: '7D', value: '7d', days: 7 },
    { label: '30D', value: '30d', days: 30 },
    { label: '90D', value: '90d', days: 90 },
    { label: '1Y', value: '1y', days: 365 },
    { label: 'ALL', value: 'all', days: null }
  ];

  // Filter price history based on selected time range
  const filterPriceHistory = (data, range) => {
    if (!data || data.length === 0) return [];
    if (range === 'all') return data;
    
    const rangeDays = timeRanges.find(r => r.value === range)?.days;
    if (!rangeDays) return data;
    
    const cutoffTime = Date.now() - (rangeDays * 24 * 60 * 60 * 1000);
    return data.filter(item => item.ts >= cutoffTime);
  };

  const filteredData = filterPriceHistory(priceHistory || [], timeRange);

  // Format chart data using chartFactory
  const { labels, datasets } = formatPriceHistoryForChart(filteredData);
  
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

  // Time range selector component
  const timeRangeComponent = (
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
  );

  // Main chart content
  const chartContent = datasets && datasets.length > 0 && datasets[0].data.length > 0 ? (
    <Line data={chartConfig.data} options={chartConfig.options} />
  ) : (
    <div className={styles.noData}>
      <p>No price data available</p>
    </div>
  );

  return (
    <ChartWrapper
      title="Bitcoin Price History"
      subtitle="Historical price data with customizable time ranges"
      loading={loading}
      onRefresh={handleRefresh}
      dataSource="CoinGecko API"
      timeRangeComponent={timeRangeComponent}
    >
      {chartContent}
    </ChartWrapper>
  );
}

export default PriceChart;
