import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { useDataFetch } from '../hooks/useDataFetch';
import { aiApi, priceApi } from '../services/apiClient';
import { Card, LoadingSpinner } from './ui';
import { createLineChart } from '../utils/chartFactory';
import styles from './AIPredictionChart.module.css';

function AIPredictionChart() {
  const [timeRange, setTimeRange] = useState('24h');

  const { data: predictions, loading: predLoading } = useDataFetch(
    () => aiApi.getPredictionHistory({ limit: 100 }),
    {
      pollInterval: 300000, // 5 minutes
      cacheKey: 'ai-predictions-history'
    }
  );

  const { data: priceHistory, loading: priceLoading } = useDataFetch(
    () => {
      const now = Date.now();
      const ranges = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      const from = now - ranges[timeRange];
      // Request enough hourly points for the selected range, cap to 3000
      const hours = Math.ceil((now - from) / (60 * 60 * 1000));
      const limit = Math.min(hours, 3000);
      return priceApi.getHistory({ symbol: 'BTC', from, to: now, limit });
    },
    {
      pollInterval: 300000,
      cacheKey: `price-history-${timeRange}`,
      dependencies: [timeRange]
    }
  );

  const loading = predLoading || priceLoading;

  // Loading state
  if (loading && (!predictions || !priceHistory)) {
    return (
      <Card className={styles.container}>
        <LoadingSpinner />
      </Card>
    );
  }

  // Prepare chart data filtered by selected time range
  const renderNow = Date.now();
  const renderRanges = { '24h': 24 * 60 * 60 * 1000, '7d': 7 * 24 * 60 * 60 * 1000, '30d': 30 * 24 * 60 * 60 * 1000 };
  const renderFrom = renderNow - (renderRanges[timeRange] || renderRanges['24h']);

  const actualData = (Array.isArray(priceHistory) ? priceHistory : [])
    .filter(p => {
      const t = p.ts || p.timestamp;
      return typeof t === 'number' && t >= renderFrom && t <= renderNow;
    })
    .map(p => ({
      x: new Date(p.ts || p.timestamp),
      y: p.price
    }));

  const predictionData = (Array.isArray(predictions) ? predictions : [])
    .filter(p => p.predicted_price && p.ts && p.ts >= renderFrom && p.ts <= renderNow)
    .map(p => ({
      x: new Date(p.ts),
      y: p.predicted_price
    }));

  const datasets = [
    {
      label: 'Actual Price',
      data: actualData,
      borderColor: '#22D3EE',
      backgroundColor: 'rgba(34, 211, 238, 0.05)',
      fill: true,
      tension: 0.4,
      pointRadius: 0
    },
    {
      label: 'AI Predictions',
      data: predictionData,
      borderColor: '#F59E0B',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      borderDash: [5, 5],
      pointRadius: 4,
      pointBackgroundColor: '#F59E0B',
      tension: 0.1
    }
  ];

  const chartConfig = createLineChart(
    datasets,
    [], // Labels not needed for time-series data with x/y coordinates
    {
      scales: {
        x: {
          type: 'time',
          time: {
            unit: timeRange === '24h' ? 'hour' : 'day',
          },
          title: {
            display: true,
            text: 'Time'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Price (USD)'
          },
          ticks: {
            callback: (value) => '$' + value.toLocaleString()
          }
        }
      },
    }
  );

  const timeRanges = [
    { label: '24H', value: '24h' },
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' }
  ];

  const predList = Array.isArray(predictions) ? predictions : [];
  const avgConfidence = predList.length > 0
    ? ((predList.reduce((sum, p) => sum + (p.confidence || 0), 0) / predList.length) * 100).toFixed(1)
    : '0';

  return (
    <Card className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>AI Predictions vs Actual Prices</h3>
        
        {/* Time Range Selector */}
        <div className={styles.timeRangeButtons}>
          {timeRanges.map(range => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`${styles.timeRangeButton} ${timeRange === range.value ? styles.active : ''}`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className={styles.chartContainer}>
        <Line key={timeRange} data={chartConfig.data} options={chartConfig.options} />
      </div>

      {/* Stats Footer */}
      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Total Predictions</div>
          <div className={styles.statValue}>{predList.length}</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Avg Confidence</div>
          <div className={styles.statValue}>{avgConfidence}%</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Time Range</div>
          <div className={`${styles.statValue} ${styles.range}`}>{timeRange.toUpperCase()}</div>
        </div>
      </div>
    </Card>
  );
}

export default AIPredictionChart;
