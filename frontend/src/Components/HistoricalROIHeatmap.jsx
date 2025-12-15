import React, { useState, useEffect } from 'react';
import { Card, LoadingSpinner } from '../components/ui';
import styles from './HistoricalROIHeatmap.module.css';

/**
 * Historical ROI Heatmap Component
 * Shows returns by purchase date vs hold period
 * Extremely valuable for investors to understand timing
 * 
 * Features:
 * - Heatmap showing ROI % for different buy dates and hold periods
 * - Color-coded cells (red = loss, yellow = small gain, green = profit)
 * - Interactive tooltips
 */
const HistoricalROIHeatmap = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  useEffect(() => {
    async function fetchPriceData() {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch 1 year of daily price data (CoinGecko free API limit)
        const response = await fetch(
          `${API_CONFIG.BASE_URL}/proxy/coingecko/market-chart?id=bitcoin&vs_currency=usd&days=365&interval=daily`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch price data');
        }
        
        const priceData = await response.json();
        const prices = priceData.prices || [];
        
        // Calculate ROI matrix
        // Buy dates: Every 30 days
        // Hold periods: 7d, 30d, 90d, 180d, 365d
        const buyDateIntervals = 30; // Sample every 30 days
        const holdPeriods = [7, 30, 90, 180, 365];
        
        const roiMatrix = [];
        
        for (let i = 0; i < prices.length; i += buyDateIntervals) {
          const buyDate = prices[i][0];
          const buyPrice = prices[i][1];
          const buyRow = { buyDate, buyPrice, roi: {} };
          
          holdPeriods.forEach(holdDays => {
            const sellIndex = i + holdDays;
            
            if (sellIndex < prices.length) {
              const sellPrice = prices[sellIndex][1];
              const roi = ((sellPrice - buyPrice) / buyPrice) * 100;
              buyRow.roi[holdDays] = roi;
            } else {
              buyRow.roi[holdDays] = null;
            }
          });
          
          roiMatrix.push(buyRow);
        }
        
        // Calculate statistics
        const allROIs = roiMatrix.flatMap(row => 
          Object.values(row.roi).filter(val => val !== null)
        );
        
        const avgROI = allROIs.reduce((sum, roi) => sum + roi, 0) / allROIs.length;
        const maxROI = Math.max(...allROIs);
        const minROI = Math.min(...allROIs);
        const positiveCount = allROIs.filter(roi => roi > 0).length;
        const winRate = (positiveCount / allROIs.length) * 100;
        
        setData({
          roiMatrix,
          holdPeriods,
          stats: {
            avgROI,
            maxROI,
            minROI,
            winRate,
          }
        });
      } catch (err) {
        console.error('ROI heatmap fetch error:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPriceData();
  }, []);

  const getColorForROI = (roi) => {
    if (roi === null) return '#2a2a2e';
    if (roi < -20) return '#7f1d1d'; // Deep red
    if (roi < -10) return '#991b1b'; // Red
    if (roi < 0) return '#b91c1c'; // Light red
    if (roi < 10) return '#ca8a04'; // Yellow
    if (roi < 30) return '#65a30d'; // Light green
    if (roi < 50) return '#16a34a'; // Green
    if (roi < 100) return '#15803d'; // Dark green
    return '#14532d'; // Deep green
  };

  const formatROI = (roi) => {
    if (roi === null) return 'N/A';
    const prefix = roi >= 0 ? '+' : '';
    return `${prefix}${roi.toFixed(1)}%`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit'
    });
  };

  return (
    <Card className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Historical ROI Heatmap</h3>
          <p className={styles.subtitle}>
            Returns by purchase date and hold period (last 2 years)
          </p>
        </div>
      </div>

      {/* Statistics */}
      {!loading && data && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Avg ROI</span>
            <span className={`${styles.statValue} ${data.stats.avgROI >= 0 ? styles.positive : styles.negative}`}>
              {formatROI(data.stats.avgROI)}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Win Rate</span>
            <span className={styles.statValue}>
              {data.stats.winRate.toFixed(1)}%
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Best Return</span>
            <span className={`${styles.statValue} ${styles.positive}`}>
              {formatROI(data.stats.maxROI)}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Worst Return</span>
            <span className={`${styles.statValue} ${styles.negative}`}>
              {formatROI(data.stats.minROI)}
            </span>
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className={styles.heatmapContainer}>
        {loading && (
          <div className={styles.centerContent}>
            <LoadingSpinner size="medium" />
            <p>Calculating ROI heatmap...</p>
          </div>
        )}

        {error && !loading && (
          <div className={styles.errorContent}>
            <p>Error: {error.message}</p>
          </div>
        )}

        {!loading && !error && data && (
          <>
            <div className={styles.heatmapScroll}>
              <table className={styles.heatmap}>
                <thead>
                  <tr>
                    <th className={styles.cornerCell}>Buy Date / Hold</th>
                    {data.holdPeriods.map(period => (
                      <th key={period} className={styles.headerCell}>
                        {period}d
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.roiMatrix.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className={styles.dateCell}>
                        {formatDate(row.buyDate)}
                      </td>
                      {data.holdPeriods.map(period => {
                        const roi = row.roi[period];
                        return (
                          <td
                            key={period}
                            className={styles.roiCell}
                            style={{ backgroundColor: getColorForROI(roi) }}
                            onMouseEnter={() => setHoveredCell({ row: rowIndex, period, roi, buyDate: row.buyDate })}
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            {formatROI(roi)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tooltip */}
            {hoveredCell && hoveredCell.roi !== null && (
              <div className={styles.tooltip}>
                <div className={styles.tooltipTitle}>
                  Bought: {formatDate(hoveredCell.buyDate)}
                </div>
                <div className={styles.tooltipContent}>
                  <span>Hold Period: {hoveredCell.period} days</span>
                  <span className={hoveredCell.roi >= 0 ? styles.positive : styles.negative}>
                    ROI: {formatROI(hoveredCell.roi)}
                  </span>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className={styles.legend}>
              <span className={styles.legendTitle}>ROI Scale:</span>
              <div className={styles.legendGradient}>
                <span style={{ backgroundColor: '#7f1d1d' }}>&lt; -20%</span>
                <span style={{ backgroundColor: '#b91c1c' }}>-10%</span>
                <span style={{ backgroundColor: '#ca8a04' }}>0%</span>
                <span style={{ backgroundColor: '#16a34a' }}>+30%</span>
                <span style={{ backgroundColor: '#15803d' }}>+50%</span>
                <span style={{ backgroundColor: '#14532d' }}>&gt; +100%</span>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default HistoricalROIHeatmap;
