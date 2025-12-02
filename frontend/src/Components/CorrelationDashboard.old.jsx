import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { colors, spacing, borderRadius, shadows } from '../styles/designSystem';
import { chartColors } from '../utils/chartConfig';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function CorrelationDashboard() {
  const [correlations, setCorrelations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timespan, setTimespan] = useState('30d');
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    fetchCorrelations(false);
  }, [timespan]);

  const fetchCorrelations = async (forceRecalculate = false) => {
    try {
      if (forceRecalculate) {
        setRecalculating(true);
      } else {
        setLoading(true);
      }
      
      const response = await fetch(
        `${API_BASE_URL}/metrics/correlations?timespan=${timespan}&recalculate=${forceRecalculate}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch correlations');
      const result = await response.json();
      setCorrelations(result.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
    if (abs > 0.5) return chartColors.primary; // Strong correlation
    if (abs > 0.2) return chartColors.info; // Moderate correlation
    return colors.textMuted; // Weak correlation
  };

  const formatChartData = () => {
    if (!correlations || correlations.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Sort by absolute correlation (strongest first)
    const sortedCorrs = [...correlations].sort((a, b) => 
      Math.abs(b.correlation_coefficient) - Math.abs(a.correlation_coefficient)
    );

    return {
      labels: sortedCorrs.map(c => c.metric_name.charAt(0).toUpperCase() + c.metric_name.slice(1)),
      datasets: [{
        label: 'Correlation with BTC Price',
        data: sortedCorrs.map(c => c.correlation_coefficient),
        backgroundColor: sortedCorrs.map(c => getCorrelationColor(c.correlation_coefficient)),
        borderColor: sortedCorrs.map(c => getCorrelationColor(c.correlation_coefficient)),
        borderWidth: 1
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: colors.cardBg,
        titleColor: colors.textPrimary,
        bodyColor: colors.textSecondary,
        borderColor: colors.cardBorder,
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const value = context.parsed.x;
            const strength = getCorrelationStrength(value);
            return `Correlation: ${value.toFixed(3)} (${strength})`;
          }
        }
      }
    },
    scales: {
      x: {
        min: -1,
        max: 1,
        ticks: {
          color: colors.textSecondary,
          callback: function(value) {
            return value.toFixed(1);
          }
        },
        grid: {
          color: colors.cardBorder
        },
        title: {
          display: true,
          text: 'Correlation Coefficient (-1 to +1)',
          color: colors.textPrimary,
          font: { size: 12, weight: 'bold' }
        }
      },
      y: {
        ticks: {
          color: colors.textSecondary,
          font: { size: 11 }
        },
        grid: {
          display: false
        }
      }
    }
  };

  const timespans = [
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
    { label: '1 Year', value: '1y' }
  ];

  return (
    <div style={{
      background: colors.cardBg,
      backdropFilter: 'blur(10px)',
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: borderRadius.lg,
      padding: spacing.xl,
      marginBottom: spacing.xl,
      boxShadow: shadows.md
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: colors.textPrimary,
            margin: 0,
            marginBottom: '0.25rem'
          }}>
            Metric Correlations with BTC Price
          </h3>
          <p style={{
            fontSize: '0.75rem',
            color: colors.textSecondary,
            margin: 0
          }}>
            Statistical correlation analysis showing relationships between metrics and Bitcoin price
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {timespans.map(ts => (
              <button
                key={ts.value}
                onClick={() => setTimespan(ts.value)}
                style={{
                  padding: '0.4rem 0.8rem',
                  background: timespan === ts.value ? colors.accent : colors.bgTertiary,
                  color: timespan === ts.value ? colors.textPrimary : colors.textSecondary,
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: borderRadius.md,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
              >
                {ts.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchCorrelations(true)}
            disabled={recalculating}
            style={{
              padding: '0.4rem 0.8rem',
              background: recalculating ? colors.textMuted : colors.accent,
              color: colors.textPrimary,
              border: 'none',
              borderRadius: borderRadius.md,
              cursor: recalculating ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            {recalculating ? '⟳ Calculating...' : '⟳ Recalculate'}
          </button>
        </div>
      </div>

      {loading && !recalculating && (
        <div style={{
          height: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.textSecondary
        }}>
          Loading correlation data...
        </div>
      )}

      {error && !loading && (
        <div style={{
          padding: spacing.md,
          textAlign: 'center',
          color: colors.error,
          backgroundColor: colors.bgTertiary,
          borderRadius: borderRadius.md,
          border: `1px solid ${colors.error}40`
        }}>
          Error: {error}
        </div>
      )}

      {!loading && !error && correlations.length === 0 && (
        <div style={{
          height: '300px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.textSecondary,
          gap: spacing.md
        }}>
          <p>No correlation data available</p>
          <button
            onClick={() => fetchCorrelations(true)}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              background: colors.accent,
              color: colors.textPrimary,
              border: 'none',
              borderRadius: borderRadius.md,
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}
          >
            Calculate Correlations
          </button>
        </div>
      )}

      {!loading && !error && correlations.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 350px',
          gap: spacing.xl,
          alignItems: 'start'
        }}>
          {/* Chart */}
          <div style={{ height: '300px' }}>
            <Bar data={formatChartData()} options={chartOptions} />
          </div>

          {/* Table */}
          <div style={{
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: borderRadius.md,
            overflow: 'hidden'
          }}>
            <div style={{
              background: colors.bgTertiary,
              padding: `${spacing.sm} ${spacing.md}`,
              borderBottom: `1px solid ${colors.cardBorder}`,
              fontWeight: '600',
              fontSize: '0.9rem',
              color: colors.textPrimary
            }}>
              Top Correlated Metrics
            </div>
            <div>
              {correlations
                .sort((a, b) => Math.abs(b.correlation_coefficient) - Math.abs(a.correlation_coefficient))
                .map((corr, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: `${spacing.sm} ${spacing.md}`,
                      borderBottom: index < correlations.length - 1 ? `1px solid ${colors.cardBorder}` : 'none',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: colors.textPrimary, marginBottom: '0.25rem' }}>
                        {corr.metric_name.charAt(0).toUpperCase() + corr.metric_name.slice(1)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>
                        {getCorrelationStrength(corr.correlation_coefficient)}
                      </div>
                    </div>
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      color: getCorrelationColor(corr.correlation_coefficient),
                      marginLeft: spacing.md
                    }}>
                      {corr.correlation_coefficient.toFixed(3)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      {!loading && !error && correlations.length > 0 && (
        <div style={{
          marginTop: spacing.xl,
          padding: spacing.md,
          background: colors.bgTertiary,
          borderRadius: borderRadius.md,
          fontSize: '0.75rem',
          color: colors.textSecondary
        }}>
          <strong style={{ color: colors.textPrimary }}>Correlation Guide:</strong>
          <div style={{ marginTop: spacing.sm, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.sm }}>
            <div>
              <span style={{ color: chartColors.primary, fontWeight: 'bold' }}>±0.7 to ±1.0</span>: Strong correlation
            </div>
            <div>
              <span style={{ color: chartColors.info, fontWeight: 'bold' }}>±0.4 to ±0.7</span>: Moderate correlation
            </div>
            <div>
              <span style={{ color: colors.textMuted, fontWeight: 'bold' }}>±0.0 to ±0.4</span>: Weak/No correlation
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CorrelationDashboard;
