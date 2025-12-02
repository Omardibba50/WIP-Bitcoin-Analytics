import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { useDataFetch } from '../hooks/useDataFetch';
import { metricsApi } from '../services/apiClient';
import { Card } from '../components/ui';
import { LoadingSpinner } from '../components/ui';
import { createBarChart } from '../utils/chartFactory';
import { colors } from '../styles/designSystem';
import styles from './CorrelationDashboard.module.css';

function CorrelationDashboard() {
  const [timespan, setTimespan] = useState('30d');
  const [recalculating, setRecalculating] = useState(false);

  const { data: correlations, loading, error, refetch } = useDataFetch(
    () => metricsApi.getCorrelations(timespan, false),
    {
      pollInterval: 300000, // 5 minutes
      cacheKey: `correlations-${timespan}`
    }
  );

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await metricsApi.getCorrelations(timespan, true);
      await refetch();
    } finally {
      setRecalculating(false);
    }
  };

  const getCorrelationStrength = (coefficient) => {
    const abs = Math.abs(coefficient);
    if (abs >= 0.7) return 'Strong';
    if (abs >= 0.4) return 'Moderate';
    if (abs >= 0.2) return 'Weak';
    return 'Very Weak';
  };

  const getCorrelationColor = (coefficient) => {
    const abs = Math.abs(coefficient);
    if (abs > 0.5) return colors.primary;
    if (abs > 0.2) return colors.info;
    return colors.textMuted;
  };

  const formatChartData = () => {
    // Handle various data formats: { data: [] }, [], or null/undefined
    let correlationArray = [];
    
    if (correlations) {
      if (Array.isArray(correlations)) {
        correlationArray = correlations;
      } else if (correlations.data && Array.isArray(correlations.data)) {
        correlationArray = correlations.data;
      }
    }
    
    if (correlationArray.length === 0) return null;

    const sortedCorrs = [...correlationArray].sort((a, b) => 
      Math.abs(b.correlation_coefficient) - Math.abs(a.correlation_coefficient)
    );

    return {
      labels: sortedCorrs.map(c => c.metric_name.charAt(0).toUpperCase() + c.metric_name.slice(1)),
      data: sortedCorrs.map(c => c.correlation_coefficient),
      colors: sortedCorrs.map(c => getCorrelationColor(c.correlation_coefficient))
    };
  };

  const timespans = [
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
    { label: '1 Year', value: '1y' }
  ];

  const chartData = formatChartData();
  const chartConfig = chartData
    ? createBarChart(
        [
          {
            label: 'Correlation with BTC Price',
            data: chartData.data,
            backgroundColor: chartData.colors,
          },
        ],
        chartData.labels,
        {
          indexAxis: 'y',
          scales: {
            x: {
              min: -1,
              max: 1,
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.parsed.x;
                  const strength = getCorrelationStrength(value);
                  return `Correlation: ${value.toFixed(3)} (${strength})`;
                },
              },
            },
          },
        }
      )
    : null;

  return (
    <Card className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Metric Correlations with BTC Price</h3>
          <p className={styles.subtitle}>
            Statistical correlation analysis showing relationships between metrics and Bitcoin price
          </p>
        </div>
        <div className={styles.controls}>
          <div className={styles.timespanButtons}>
            {timespans.map(ts => (
              <button
                key={ts.value}
                onClick={() => setTimespan(ts.value)}
                className={`${styles.timespanButton} ${timespan === ts.value ? styles.active : ''}`}
              >
                {ts.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className={`${styles.recalculateButton} ${recalculating ? styles.disabled : ''}`}
          >
            {recalculating ? '⟳ Calculating...' : '⟳ Recalculate'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && !recalculating && (
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className={styles.error}>
          <p>Error: {error.message || error}</p>
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && (!correlations || correlations.length === 0) && (
        <div className={styles.noData}>
          <p>No correlation data available</p>
          <button onClick={handleRecalculate} className={styles.calculateButton}>
            Calculate Correlations
          </button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && correlations && correlations.length > 0 && (
        <>
          <div className={styles.content}>
            {/* Chart */}
            <div className={styles.chartContainer}>
              {chartConfig && (
                <Bar data={chartConfig.data} options={chartConfig.options} />
              )}
            </div>

            {/* Table */}
            <div className={styles.tableContainer}>
              <div className={styles.tableHeader}>Top Correlated Metrics</div>
              <div>
                {correlations
                  .sort((a, b) => Math.abs(b.correlation_coefficient) - Math.abs(a.correlation_coefficient))
                  .map((corr, index) => (
                    <div
                      key={index}
                      className={`${styles.tableRow} ${index < correlations.length - 1 ? styles.withBorder : ''}`}
                    >
                      <div className={styles.metricInfo}>
                        <div className={styles.metricName}>
                          {corr.metric_name.charAt(0).toUpperCase() + corr.metric_name.slice(1)}
                        </div>
                        <div className={styles.metricStrength}>
                          {getCorrelationStrength(corr.correlation_coefficient)}
                        </div>
                      </div>
                      <div 
                        className={styles.correlationValue}
                        style={{ color: getCorrelationColor(corr.correlation_coefficient) }}
                      >
                        {corr.correlation_coefficient.toFixed(3)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className={styles.legend}>
            <strong>Correlation Guide:</strong>
            <div className={styles.legendGrid}>
              <div>
                <span className={styles.strongCorr}>±0.7 to ±1.0</span>: Strong correlation
              </div>
              <div>
                <span className={styles.moderateCorr}>±0.4 to ±0.7</span>: Moderate correlation
              </div>
              <div>
                <span className={styles.weakCorr}>±0.0 to ±0.4</span>: Weak/No correlation
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

export default CorrelationDashboard;
