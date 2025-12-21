import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { useDataFetch } from '../hooks/useDataFetch';
import { priceApi } from '../services/apiClient';
import { createLineChart, formatLargeNumber } from '../utils/chartFactory';
import { Card, LoadingSpinner, EmptyState } from './ui';
import { colors } from '../styles/designSystem';
import styles from './TransactionVolumeChart.module.css';

/**
 * Transaction Volume vs BTC Price Chart Component
 * Shows daily transaction count vs Bitcoin price correlation
 * 
 * Features:
 * - Dual Y-axis for transaction volume and BTC price
 * - Time range selector
 * - Fetches data from blockchain.info charts API
 */
const TransactionVolumeChart = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [txData, setTxData] = useState(null);
  const [txLoading, setTxLoading] = useState(true);
  const [txError, setTxError] = useState(null);

  // Refetch function for transaction data
  const refetchTransactionData = React.useCallback(() => {
    async function fetchTransactionVolume() {
      setTxLoading(true);
      setTxError(null);
      
      try {
        const timespan = timeRange === 'all' ? '1460days' : 
                        timeRange === '1y' ? '365days' : 
                        timeRange === '90d' ? '90days' : 
                        timeRange === '7d' ? '7days' : '30days';
        
        const response = await fetch(
          `https://api.blockchain.info/charts/n-transactions?timespan=${timespan}&format=json&cors=true`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch transaction data');
        }
        
        const text = await response.text();
        
        // Check if response is HTML (error page)
        if (text.includes('<!DOCTYPE') || text.includes('<html>')) {
          throw new Error('API returned HTML instead of JSON');
        }
        
        const data = JSON.parse(text);
        
        if (!data.values || !Array.isArray(data.values)) {
          throw new Error('Invalid response format');
        }
        
        setTxData(data.values);
      } catch (err) {
        console.error('Transaction volume fetch error:', err);
        setTxError(err);
      } finally {
        setTxLoading(false);
      }
    }
    
    fetchTransactionVolume();
  }, [timeRange]);

  // Fetch BTC price history
  const { 
    data: priceData, 
    loading: priceLoading, 
    error: priceError 
  } = useDataFetch(
    () => {
      const days = getDaysFromRange(timeRange);
      const to = Date.now();
      const from = to - (days * 24 * 60 * 60 * 1000);
      const limit = Math.min(days * 24, 3000); // up to hourly points, cap to 3000
      return priceApi.getHistory({ from, to, limit });
    },
    {
      interval: 5 * 60 * 1000, // 5 minutes
      priority: 'tertiary',
      dependencies: [timeRange],
    }
  );

  // Fetch transaction volume data from blockchain.info
  React.useEffect(() => {
    refetchTransactionData();
  }, [refetchTransactionData]);

  const loading = txLoading || priceLoading;
  const error = txError || priceError;

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
    // priceData is already an array, not { data: [...] }
    if (!txData || !Array.isArray(txData) || txData.length === 0 || 
        !priceData || !Array.isArray(priceData) || priceData.length === 0) {
      return { labels: [], datasets: [] };
    }

    const priceHistory = priceData;

    // Create a map of prices by timestamp (normalized to day)
    const priceByDay = new Map();
    priceHistory.forEach(p => {
      const ts = p.timestamp || p.ts;
      const date = new Date(ts);
      date.setHours(0, 0, 0, 0);
      const dayKey = date.getTime();
      priceByDay.set(dayKey, p.price);
    });

    // Sample transaction data for performance (max 200 points)
    const samplingRate = Math.max(1, Math.floor(txData.length / 200));
    const sampledTxData = txData.filter((_, index) => index % samplingRate === 0);

    // Merge transaction volume with price data
    const mergedData = sampledTxData.map(tx => {
      const timestamp = tx.x * 1000; // Convert to milliseconds
      const date = new Date(timestamp);
      
      // Validate date (silently skip invalid dates)
      
      date.setHours(0, 0, 0, 0);
      const dayKey = date.getTime();
      
      return {
        timestamp,
        txCount: tx.y,
        price: priceByDay.get(dayKey) || null
      };
    });

    // Forward-fill missing prices
    let lastPrice = null;
    mergedData.forEach(item => {
      if (item.price !== null) {
        lastPrice = item.price;
      } else if (lastPrice !== null) {
        item.price = lastPrice;
      }
    });

    const labels = mergedData.map(item => {
      const date = new Date(item.timestamp);
      
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

    return {
      labels,
      datasets: [
        {
          label: 'Daily Transactions',
          data: mergedData.map(item => item.txCount),
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
          data: mergedData.map(item => item.price),
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
          text: 'Daily Transactions',
          color: colors.info,
        },
        ticks: {
          color: colors.info,
          callback: (value) => formatLargeNumber(value)
        },
        grid: {
          color: colors.info + '1A'
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
              // Transaction count
              label += formatLargeNumber(context.parsed.y) + ' txs';
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
        <h3 className={styles.title}>Transaction Volume vs BTC Price</h3>
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
            <p>Loading transaction data...</p>
          </div>
        )}

        {error && !loading && (
          <div className={styles.errorContent}>
            <p>Error: {error.message}</p>
          </div>
        )}

        {!loading && !error && (!chartData.datasets || chartData.datasets.length === 0) && (
          <EmptyState 
            message="No transaction volume data available"
            icon="💱"
            action={refetchTransactionData}
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

export default TransactionVolumeChart;
