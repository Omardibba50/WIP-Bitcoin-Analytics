import React, { useEffect, useState } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { aiApi } from '../services/api';

function AIModelMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await aiApi.getModelMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching model metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10 * 60 * 1000); // Refresh every 10 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{
        background: 'rgba(26, 26, 26, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 179, 255, 0.2)',
        borderRadius: '12px',
        padding: '1.5rem',
        height: '450px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#00b3ff' }}>Loading model metrics...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div style={{
        background: 'rgba(26, 26, 26, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 77, 77, 0.3)',
        borderRadius: '12px',
        padding: '1.5rem',
        height: '450px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#ff4d4d' }}>Model metrics unavailable</div>
      </div>
    );
  }

  const accuracy = metrics.performance?.directionalAccuracy || 0;
  const accuracyLabel = metrics.evaluation?.directional_accuracy_label || 'Unknown';

  // Accuracy Gauge Chart
  const gaugeData = {
    labels: ['Accuracy', 'Remaining'],
    datasets: [{
      data: [accuracy, 100 - accuracy],
      backgroundColor: [
        '#00b3ff',
        'rgba(255, 255, 255, 0.05)'
      ],
      borderWidth: 0,
      circumference: 180,
      rotation: 270
    }]
  };

  const gaugeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    }
  };

  // Performance Metrics Bar Chart
  const performanceData = {
    labels: ['MAE', 'Loss', 'MAPE'],
    datasets: [{
      label: 'Score',
      data: [
        (metrics.performance?.testMAE || 0) * 1000, // Scale for visibility
        (metrics.performance?.testLoss || 0) * 100000,
        (metrics.performance?.testMAPE || 0) / 10
      ],
      backgroundColor: [
        'rgba(0, 179, 255, 0.8)',
        'rgba(0, 255, 136, 0.8)',
        'rgba(255, 170, 0, 0.8)'
      ],
      borderRadius: 6
    }]
  };

  const performanceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 26, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(0, 179, 255, 0.3)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: '#888'
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          color: '#fff',
          font: {
            size: 11,
            weight: '600'
          }
        }
      }
    }
  };

  return (
    <div style={{
      background: 'rgba(26, 26, 26, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(0, 179, 255, 0.2)',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '2rem'
    }}>
      {/* Header */}
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#fff',
        margin: '0 0 1.5rem 0',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        Model Performance Metrics
      </h3>

      {/* Two Column Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem'
      }}>
        {/* Left Column: Model Info & Accuracy */}
        <div>
          {/* Model Information */}
          <div style={{
            background: 'rgba(0, 179, 255, 0.05)',
            border: '1px solid rgba(0, 179, 255, 0.2)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#00b3ff',
              margin: '0 0 1rem 0',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Model Information
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <InfoRow label="ID" value={metrics.model?.id || 'N/A'} />
              <InfoRow label="Type" value={metrics.model?.type || 'N/A'} />
              <InfoRow label="Architecture" value={metrics.model?.architecture || 'N/A'} />
              <InfoRow 
                label="Trained" 
                value={metrics.model?.trained_at 
                  ? new Date(metrics.model.trained_at).toLocaleDateString() 
                  : 'N/A'} 
              />
              <InfoRow label="Training Time" value={metrics.model?.training_time || 'N/A'} />
              <InfoRow 
                label="Dataset Size" 
                value={metrics.dataset 
                  ? `${(metrics.dataset.train + metrics.dataset.validation + metrics.dataset.test).toLocaleString()} samples`
                  : 'N/A'} 
              />
            </div>
          </div>

          {/* Directional Accuracy Gauge */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <h4 style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#fff',
              margin: '0 0 1rem 0',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Directional Accuracy
            </h4>
            <div style={{ height: '180px', position: 'relative' }}>
              <Doughnut data={gaugeData} options={gaugeOptions} />
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#00b3ff'
                }}>
                  {accuracy.toFixed(1)}%
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#888',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginTop: '0.25rem'
                }}>
                  {accuracyLabel}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Performance Metrics */}
        <div>
          {/* Performance Bar Chart */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#fff',
              margin: '0 0 1rem 0',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Error Metrics
            </h4>
            <div style={{ height: '180px' }}>
              <Bar data={performanceData} options={performanceOptions} />
            </div>
          </div>

          {/* Detailed Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem'
          }}>
            <StatCard
              label="Test MAE"
              value={(metrics.performance?.testMAE * 100 || 0).toFixed(4)}
              color="#00b3ff"
            />
            <StatCard
              label="Test Loss"
              value={(metrics.performance?.testLoss || 0).toExponential(4)}
              color="#00b3ff"
            />
            <StatCard
              label="Test MAPE"
              value={(metrics.performance?.testMAPE || 0).toFixed(2)}
              color="#00b3ff"
            />
            <StatCard
              label="Val Loss"
              value={(metrics.performance?.bestValLoss || 0).toExponential(4)}
              color="#00b3ff"
            />
          </div>

          {/* Features Info */}
          <div style={{
            background: 'rgba(0, 255, 136, 0.05)',
            border: '1px solid rgba(0, 255, 136, 0.2)',
            borderRadius: '8px',
            padding: '1rem',
            marginTop: '1rem'
          }}>
            <h4 style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#00b3ff',
              margin: '0 0 0.75rem 0',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Feature Engineering
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div style={{ color: '#888', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                  Features
                </div>
                <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700' }}>
                  {metrics.features?.count || 10}
                </div>
              </div>
              <div>
                <div style={{ color: '#888', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                  Timesteps
                </div>
                <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700' }}>
                  {metrics.features?.timesteps || 60}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#888', fontSize: '0.85rem' }}>{label}:</span>
      <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600' }}>{value}</span>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: `1px solid ${color}33`,
      borderRadius: '8px',
      padding: '1rem',
      textAlign: 'center'
    }}>
      <div style={{ color: '#888', fontSize: '0.7rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ color: color, fontSize: '1.25rem', fontWeight: '700' }}>
        {value}
      </div>
    </div>
  );
}

export default AIModelMetrics;
