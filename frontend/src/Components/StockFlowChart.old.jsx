import React, { useState, useEffect, useId } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, LoadingSpinner } from './ui';
import { colors } from '../styles/designSystem';
import styles from './StockFlowChart.module.css';
import { metricsApi, priceApi } from '../services/apiClient';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

/**
 * Stock-to-Flow Chart Component
 * Displays Bitcoin stock-to-flow ratio alongside price history
 */
function StockFlowChart({ 
  symbol = 'BTC',
  startDate,
  endDate 
}) {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const chartId = useId();

  const DAYS_HISTORY = 1460; // 4 years of data

  // Normalize timestamp to midnight UTC
  const normalizeDay = (ts) => {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Fetch stock-to-flow data using metricsApi
        const s2fResponse = await metricsApi.getStockToFlowData(DAYS_HISTORY);
        
        if (!s2fResponse || !s2fResponse.data) {
          throw new Error('Failed to fetch stock-to-flow data');
        }
        const s2fRaw = s2fResponse.data;

        // Try to fetch price history (optional)
        let priceRaw = [];
        try {
          const priceResponse = await priceApi.getHistory({ days: DAYS_HISTORY });
          if (priceResponse && priceResponse.data) {
            priceRaw = priceResponse.data;
          }
        } catch (priceErr) {
          console.warn('Price history fetch failed, showing S2F only:', priceErr);
        }

        // Map price by day
        const priceByDay = new Map();
        priceRaw.forEach((p) => {
          const dayKey = normalizeDay(p.timestamp);
          const price = p.price;
          if (!Number.isFinite(price)) return;
          priceByDay.set(dayKey, price);
        });

        // Merge S2F and price data with forward-fill
        let lastPrice = null;
        const combined = s2fRaw.map((p) => {
          const dayKey = normalizeDay(p.timestamp);
          let price = priceByDay.get(dayKey) ?? null;

          if (price != null) {
            lastPrice = price;
          } else if (lastPrice != null) {
            price = lastPrice;
          }

          return {
            date: new Date(dayKey),
            stockToFlow: p.stockToFlow,
            priceUSD: price,
          };
        });

        setSeries(combined);
      } catch (err) {
        console.error('StockFlowChart error:', err);
        setError(err.message || 'Failed to load stock-to-flow data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Handle time range selection
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  const timeRanges = [
    { label: '7D', value: '7d', days: 7 },
    { label: '30D', value: '30d', days: 30 },
    { label: '90D', value: '90d', days: 90 },
    { label: '1Y', value: '1y', days: 365 },
    { label: 'ALL', value: 'all', days: null }
  ];

  // Filter data based on date range
  const getVisibleSeries = () => {
    if (startDate && endDate) {
      const from = new Date(startDate).getTime();
      const to = new Date(endDate).getTime();
      return series.filter((row) => {
        const t = row.date.getTime();
        return t >= from && t <= to;
      });
    }

    // Default: show last N days based on timeRange
    const rangeConfig = timeRanges.find(r => r.value === timeRange);
    if (!rangeConfig || !rangeConfig.days) {
      return series;
    }

    const total = series.length;
    const startIndex = Math.max(total - rangeConfig.days, 0);
    return series.slice(startIndex);
  };

  // Prepare chart data
  const prepareChartData = () => {
    const visibleSeries = getVisibleSeries();
    
    if (!visibleSeries.length) {
      return { labels: [], datasets: [] };
    }

    const labels = visibleSeries.map(row => row.date);
    
    const datasets = [
      {
        label: 'Stock-to-Flow Ratio',
        data: visibleSeries.map(row => row.stockToFlow),
        borderColor: colors.warning,
        backgroundColor: `${colors.warning}20`,
        tension: 0.3,
        pointRadius: 0,
        spanGaps: true,
      },
      {
        label: `${symbol} Price (USD, log)`,
        data: visibleSeries.map(row => row.priceUSD || null),
        borderColor: colors.primary,
        backgroundColor: `${colors.primary}20`,
        tension: 0.3,
        pointRadius: 0,
        spanGaps: true,
      }
    ];

    return { labels, datasets };
  };

  // Create chart configuration
  const chartConfig = {
    type: 'line',
    data: prepareChartData(),
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        title: {
          display: false,
        },
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: colors.textPrimary,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              if (value == null) return '';

              if (label.includes('Stock-to-Flow')) {
                return `S2F: ${value.toFixed(2)}`;
              }
              if (label.includes('Price')) {
                return `Price: $${Number(value).toLocaleString('en-US', {
                  maximumFractionDigits: 0,
                })}`;
              }
              return `${label}: ${value}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: 'time',
          time: { unit: 'day' },
          ticks: { color: colors.textSecondary },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
        },
        y: {
          position: 'left',
          title: {
            display: true,
            text: 'Stock-to-Flow Ratio',
            color: colors.textPrimary,
          },
          ticks: {
            color: colors.textSecondary,
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
          },
        },
        y1: {
          position: 'right',
          type: 'logarithmic',
          title: {
            display: true,
            text: `${symbol} Price (USD, log)`,
            color: colors.success,
          },
          ticks: {
            color: colors.success,
            callback: (value) =>
              `$${Number(value).toLocaleString('en-US', {
                maximumFractionDigits: 0,
              })}`,
          },
          grid: {
            display: false,
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <Card className={styles.container}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="medium" />
          <p>Loading stock-to-flow data...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={styles.container}>
        <div className={styles.errorContainer}>
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  const { datasets } = prepareChartData();

  return (
    <Card className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Stock-to-Flow Model</h3>
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
          <Line key={chartId} data={chartConfig.data} options={chartConfig.options} />
        ) : (
          <div className={styles.noData}>
            <p>No stock-to-flow data available</p>
          </div>
        )}
      </div>
    </Card>
  );
}

export default StockFlowChart;
