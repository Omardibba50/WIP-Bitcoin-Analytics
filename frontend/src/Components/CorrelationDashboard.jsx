import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';

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
    if (coefficient > 0.5) return '#10b981'; // Green - strong positive
    if (coefficient > 0.2) return '#6ee7b7'; // Light green - moderate positive
    if (coefficient > -0.2) return '#94a3b8'; // Gray - weak
    if (coefficient > -0.5) return '#fca5a5'; // Light red - moderate negative
    return '#ef4444'; // Red - strong negative
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
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#000000',
        bodyColor: '#000000',
        borderColor: '#ddd',
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
          color: '#000000',
          callback: function(value) {
            return value.toFixed(1);
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        title: {
          display: true,
          text: 'Correlation Coefficient (-1 to +1)',
          color: '#000000',
          font: { size: 12, weight: 'bold' }
        }
      },
      y: {
        ticks: {
          color: '#000000',
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
      background: '#ffffff',
      border: '1px solid #e0e0e0',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '2rem'
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
            color: '#000000',
            margin: 0,
            marginBottom: '0.25rem'
          }}>
            Metric Correlations with BTC Price
          </h3>
          <p style={{
            fontSize: '0.75rem',
            color: '#666',
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
                  background: timespan === ts.value ? '#00b3ff' : 'rgba(0, 0, 0, 0.05)',
                  color: timespan === ts.value ? '#ffffff' : '#000000',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '6px',
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
              background: recalculating ? '#ccc' : '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
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
          color: '#666'
        }}>
          Loading correlation data...
        </div>
      )}

      {error && !loading && (
        <div style={{
          padding: '1rem',
          textAlign: 'center',
          color: '#ff6b6b',
          backgroundColor: '#fff5f5',
          borderRadius: '8px'
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
          color: '#666',
          gap: '1rem'
        }}>
          <p>No correlation data available</p>
          <button
            onClick={() => fetchCorrelations(true)}
            style={{
              padding: '0.5rem 1rem',
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
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
          gap: '2rem',
          alignItems: 'start'
        }}>
          {/* Chart */}
          <div style={{ height: '300px' }}>
            <Bar data={formatChartData()} options={chartOptions} />
          </div>

          {/* Table */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#f8f9fa',
              padding: '0.75rem 1rem',
              borderBottom: '1px solid #e0e0e0',
              fontWeight: '600',
              fontSize: '0.9rem',
              color: '#000000'
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
                      padding: '0.75rem 1rem',
                      borderBottom: index < correlations.length - 1 ? '1px solid #f0f0f0' : 'none',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#000000', marginBottom: '0.25rem' }}>
                        {corr.metric_name.charAt(0).toUpperCase() + corr.metric_name.slice(1)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        {getCorrelationStrength(corr.correlation_coefficient)}
                      </div>
                    </div>
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      color: getCorrelationColor(corr.correlation_coefficient),
                      marginLeft: '1rem'
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
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#f8f9fa',
          borderRadius: '8px',
          fontSize: '0.75rem',
          color: '#666'
        }}>
          <strong style={{ color: '#000000' }}>Correlation Guide:</strong>
          <div style={{ marginTop: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
            <div>
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>+1.0 to +0.7</span>: Strong positive correlation
            </div>
            <div>
              <span style={{ color: '#6ee7b7', fontWeight: 'bold' }}>+0.7 to +0.4</span>: Moderate positive
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>+0.2 to -0.2</span>: Weak/No correlation
            </div>
            <div>
              <span style={{ color: '#fca5a5', fontWeight: 'bold' }}>-0.4 to -0.7</span>: Moderate negative
            </div>
            <div>
              <span style={{ color: '#ef4444', fontWeight: 'bold' }}>-0.7 to -1.0</span>: Strong negative correlation
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CorrelationDashboard;
