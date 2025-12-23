import React, { useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { useDataFetch } from '../hooks/useDataFetch';
import { apiClient, priceApi } from '../services/apiClient';
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
  const [showBTC, setShowBTC] = useState(true);
  const [showGold, setShowGold] = useState(true);

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

  // Fetch gold price history (XAUUSD daily) from backend proxy
  const { 
    data: goldPriceData,
    refetch: refetchGoldPrice
  } = useDataFetch(
    () => apiClient.get('/proxy/gold-xauusd'),
    {
      interval: 12 * 60 * 60 * 1000,
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

  const normalizeTimestampMs = (ts) => {
    const n = Number(ts);
    if (!Number.isFinite(n)) return null;
    return n < 1e12 ? n * 1000 : n;
  };

  const dayKeyMs = (tsMs) => {
    const d = new Date(tsMs);
    if (isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const rangeBounds = useMemo(() => {
    const days = getDaysFromRange(timeRange);
    const to = Date.now();
    const from = to - (days * 24 * 60 * 60 * 1000);
    return { from, to };
  }, [timeRange]);

  // Format data for chart
  const formatChartData = () => {
    // btcPriceData is already an array, not { data: [...] }
    if (!btcPriceData || !Array.isArray(btcPriceData) || btcPriceData.length === 0) {
      return { labels: [], datasets: [] };
    }

    const btcByDay = new Map();
    btcPriceData.forEach(p => {
      const tsMs = normalizeTimestampMs(p.timestamp ?? p.ts);
      if (!tsMs) return;
      if (tsMs < rangeBounds.from || tsMs > rangeBounds.to) return;
      const dk = dayKeyMs(tsMs);
      if (!dk) return;
      btcByDay.set(dk, p.price);
    });

    const goldArr = Array.isArray(goldPriceData) ? goldPriceData : (goldPriceData?.data || []);
    const goldByDay = new Map();
    goldArr.forEach(g => {
      const tsMs = normalizeTimestampMs(g.timestamp ?? g.ts);
      if (!tsMs) return;
      if (tsMs < rangeBounds.from || tsMs > rangeBounds.to) return;
      const dk = dayKeyMs(tsMs);
      if (!dk) return;
      goldByDay.set(dk, g.price);
    });

    const allDays = Array.from(new Set([...btcByDay.keys(), ...goldByDay.keys()])).sort((a, b) => a - b);
    if (allDays.length === 0) {
      return { labels: [], datasets: [] };
    }

    const merged = allDays.map(dk => ({
      timestamp: dk,
      btc: btcByDay.get(dk) ?? null,
      gold: goldByDay.get(dk) ?? null,
    }));

    let lastBtc = null;
    let lastGold = null;
    merged.forEach(row => {
      if (row.btc != null) lastBtc = row.btc;
      else if (lastBtc != null) row.btc = lastBtc;

      if (row.gold != null) lastGold = row.gold;
      else if (lastGold != null) row.gold = lastGold;
    });

    const samplingRate = Math.max(1, Math.floor(merged.length / 200));
    const sampled = merged.filter((_, idx) => idx % samplingRate === 0);

    const labels = sampled.map(item => {
      const date = new Date(item.timestamp);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? '2-digit' : undefined
      });
    });

    const datasets = [];
    if (showBTC) {
      datasets.push({
        label: 'BTC Price (USD)',
        data: sampled.map(item => item.btc),
        borderColor: colors.primary,
        backgroundColor: colors.primary + '20',
        yAxisID: 'y',
        tension: 0.4,
        pointRadius: 1,
        pointHoverRadius: 5,
        borderWidth: 2,
      });
    }

    if (showGold) {
      datasets.push({
        label: 'Gold Price (USD/oz)',
        data: sampled.map(item => item.gold),
        borderColor: colors.warning,
        backgroundColor: colors.warning + '20',
        yAxisID: 'y1',
        tension: 0.4,
        pointRadius: 1,
        pointHoverRadius: 5,
        borderWidth: 2,
      });
    }

    return { labels, datasets };
  };

  // Get formatted chart data
  const chartData = formatChartData();

  // Create chart configuration using chartFactory
  const chartConfig = createLineChart(chartData.datasets, chartData.labels, {
    scales: {
      y: {
        type: 'linear',
        display: showBTC,
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
        display: showGold,
        position: 'right',
        title: {
          display: true,
          text: 'Gold Price (USD/oz)',
          color: colors.warning,
        },
        ticks: {
          color: colors.warning,
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
            
            label += '$' + formatLargeNumber(context.parsed.y);
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

        <div className={styles.seriesToggles}>
          <button
            type="button"
            onClick={() => {
              if (showBTC && !showGold) return;
              setShowBTC(v => !v);
            }}
            className={`${styles.seriesToggle} ${showBTC ? styles.seriesToggleActive : ''}`}
            aria-pressed={showBTC}
          >
            BTC
          </button>
          <button
            type="button"
            onClick={() => {
              if (showGold && !showBTC) return;
              setShowGold(v => !v);
            }}
            className={`${styles.seriesToggle} ${showGold ? styles.seriesToggleActive : ''}`}
            aria-pressed={showGold}
          >
            Gold
          </button>
        </div>

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
            action={() => {
              refetchBtcPrice();
              refetchGoldPrice();
            }}
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
