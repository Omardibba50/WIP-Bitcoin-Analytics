import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Card, LoadingSpinner } from './ui';
import { createLineChart } from '../utils/chartFactory';
import { colors } from '../styles/designSystem';
import { API_CONFIG } from '../constants/config';
import styles from './MVRVChart.module.css';

/**
 * MVRV Ratio Chart Component
 * Market Value to Realized Value - Key profitability indicator
 * 
 * MVRV Ratio Interpretation:
 * - > 3.5: Overvalued zone (potential top)
 * - 2.5 - 3.5: Euphoria zone
 * - 1.0 - 2.5: Neutral/Fair value
 * - < 1.0: Undervalued zone (accumulation opportunity)
 */
const MVRVChart = () => {
  const [timeRange, setTimeRange] = useState('1y');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const timeRanges = [
    { label: '90D', value: '90d' },
    { label: '1Y', value: '1y' },
    { label: '2Y', value: '2y' },
    { label: 'ALL', value: 'all' },
  ];

  function getDaysFromRange(range) {
    const map = { '90d': 90, '1y': 365, '2y': 730, 'all': 1825 };
    return map[range] || 365;
  }

  useEffect(() => {
    async function fetchMVRVData() {
      setLoading(true);
      setError(null);
      
      try {
        const days = getDaysFromRange(timeRange);
        const timespan = `${days}days`;
        
        // Fetch Bitcoin price history
        const priceResponse = await fetch(
          `${API_CONFIG.BASE_URL}/proxy/coingecko/market-chart?id=bitcoin&vs_currency=usd&days=${days}&interval=daily`
        );
        
        if (!priceResponse.ok) {
          throw new Error('Failed to fetch price data');
        }
        
        const priceData = await priceResponse.json();
        const prices = priceData.prices || [];
        
        // Calculate MVRV approximation
        // Note: True MVRV requires on-chain data (realized cap)
        // We'll approximate using a moving average as realized price
        const mvrvData = [];
        
        for (let i = 0; i < prices.length; i++) {
          const timestamp = prices[i][0];
          const marketPrice = prices[i][1];
          
          // Calculate realized price (approximation using 200-day moving average)
          let realizedPrice = marketPrice;
          if (i >= 200) {
            const sum = prices.slice(i - 200, i).reduce((acc, p) => acc + p[1], 0);
            realizedPrice = sum / 200;
          } else if (i > 0) {
            const sum = prices.slice(0, i).reduce((acc, p) => acc + p[1], 0);
            realizedPrice = sum / i;
          }
          
          const mvrv = realizedPrice > 0 ? marketPrice / realizedPrice : 1;
          
          mvrvData.push({
            timestamp,
            mvrv,
            marketPrice,
            realizedPrice,
          });
        }
        
        const currentMVRV = mvrvData.length > 0 ? mvrvData[mvrvData.length - 1].mvrv : 0;
        
        setData({
          currentMVRV,
          mvrvData,
        });
      } catch (err) {
        console.error('MVRV fetch error:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMVRVData();
  }, [timeRange]);

  const getMVRVZone = (mvrv) => {
    if (mvrv > 3.5) return { zone: 'Overvalued', color: colors.error };
    if (mvrv > 2.5) return { zone: 'Euphoria', color: colors.warning };
    if (mvrv > 1.0) return { zone: 'Fair Value', color: colors.success };
    return { zone: 'Accumulation', color: colors.info };
  };

  const formatChartData = () => {
    if (!data || !data.mvrvData || data.mvrvData.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = data.mvrvData.map(item => {
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
          label: 'MVRV Ratio',
          data: data.mvrvData.map(item => item.mvrv),
          borderColor: colors.primary,
          backgroundColor: colors.primary + '20',
          tension: 0.4,
          pointRadius: 1,
          pointHoverRadius: 5,
          borderWidth: 2,
          fill: true,
        }
      ]
    };
  };

  const chartData = formatChartData();
  
  const chartConfig = createLineChart(chartData.datasets, chartData.labels, {
    scales: {
      y: {
        title: {
          display: true,
          text: 'MVRV Ratio',
        },
        grid: {
          color: (context) => {
            // Highlight key levels
            const value = context.tick.value;
            if (value === 1) return 'rgba(34, 197, 94, 0.5)'; // Green at 1.0
            if (value === 3.5) return 'rgba(239, 68, 68, 0.5)'; // Red at 3.5
            return 'rgba(255, 255, 255, 0.05)';
          }
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const mvrv = context.parsed.y;
            const zone = getMVRVZone(mvrv);
            return [
              `MVRV: ${mvrv.toFixed(3)}`,
              `Zone: ${zone.zone}`
            ];
          }
        }
      }
    }
  });

  const currentZone = data ? getMVRVZone(data.currentMVRV) : { zone: 'Loading...', color: colors.textSecondary };

  return (
    <Card className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>MVRV Ratio</h3>
          <p className={styles.subtitle}>
            Market Value to Realized Value - Profitability Indicator
          </p>
        </div>
        <div className={styles.timeRangeButtons}>
          {timeRanges.map(range => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`${styles.timeRangeButton} ${
                timeRange === range.value ? styles.timeRangeButtonActive : ''
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Current MVRV Display */}
      {!loading && data && (
        <div className={styles.metricContainer}>
          <div className={styles.currentMetric}>
            <span className={styles.metricLabel}>Current MVRV:</span>
            <span className={styles.metricValue}>
              {data.currentMVRV.toFixed(3)}
            </span>
            <span className={styles.zoneIndicator} style={{ color: currentZone.color }}>
              {currentZone.zone}
            </span>
          </div>
          
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ backgroundColor: colors.error }}></span>
              <span>&gt; 3.5: Overvalued</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ backgroundColor: colors.warning }}></span>
              <span>2.5-3.5: Euphoria</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ backgroundColor: colors.success }}></span>
              <span>1.0-2.5: Fair Value</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ backgroundColor: colors.info }}></span>
              <span>&lt; 1.0: Accumulation</span>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className={styles.chartContainer}>
        {loading && (
          <div className={styles.centerContent}>
            <LoadingSpinner size="medium" />
            <p>Loading MVRV data...</p>
          </div>
        )}

        {error && !loading && (
          <div className={styles.errorContent}>
            <p>Error: {error.message}</p>
          </div>
        )}

        {!loading && !error && chartData.datasets.length > 0 && (
          <Line data={chartConfig.data} options={chartConfig.options} />
        )}
      </div>
    </Card>
  );
};

export default MVRVChart;
