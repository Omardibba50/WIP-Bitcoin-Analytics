import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { aiApi, priceApi } from '../services/api';

function AIPredictionChart() {
  const [predictions, setPredictions] = useState([]);
  const [actualPrices, setActualPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch prediction history
      const predHistory = await aiApi.getPredictionHistory(100);
      setPredictions(predHistory.predictions || []);
      
      // Fetch actual price history for comparison
      const now = Date.now();
      const ranges = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      const from = now - ranges[timeRange];
      const priceHistory = await priceApi.getHistory('BTC', from, now, 500);
      setActualPrices(priceHistory);
      
    } catch (err) {
      console.error('Error fetching AI chart data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [timeRange]);

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
        <div style={{ color: '#00b3ff' }}>Loading prediction chart...</div>
      </div>
    );
  }

  // Prepare chart data
  const actualData = actualPrices.map(p => ({
    x: new Date(p.ts),
    y: p.price
  }));

  const predictionData = predictions
    .filter(p => p.predicted_price && p.ts)
    .map(p => ({
      x: new Date(p.ts),
      y: p.predicted_price
    }));

  const chartData = {
    datasets: [
      {
        label: 'Actual Price',
        data: actualData,
        borderColor: '#00b3ff',
        backgroundColor: 'rgba(0, 179, 255, 0.05)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true
      },
      {
        label: 'AI Predictions',
        data: predictionData,
        borderColor: '#00b3ff',
        backgroundColor: 'rgba(0, 179, 255, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 4,
        pointHoverRadius: 8,
        pointBackgroundColor: '#00b3ff',
        pointBorderColor: '#1a1a1a',
        pointBorderWidth: 2,
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#fff',
          padding: 15,
          font: {
            size: 12,
            weight: '600'
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 26, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(0, 179, 255, 0.3)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += '$' + context.parsed.y.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeRange === '24h' ? 'hour' : timeRange === '7d' ? 'day' : 'day',
          displayFormats: {
            hour: 'MMM d, HH:mm',
            day: 'MMM d'
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: '#888',
          font: {
            size: 11
          }
        }
      },
      y: {
        position: 'right',
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: '#888',
          font: {
            size: 11
          },
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  const timeRanges = [
    { label: '24H', value: '24h' },
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' }
  ];

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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#fff',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          AI Predictions vs Actual Prices
        </h3>
        
        {/* Time Range Selector */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {timeRanges.map(range => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              style={{
                padding: '0.4rem 0.8rem',
                background: timeRange === range.value 
                  ? 'rgba(0, 179, 255, 0.2)' 
                  : 'rgba(255, 255, 255, 0.05)',
                color: timeRange === range.value ? '#00b3ff' : '#888',
                border: `1px solid ${timeRange === range.value ? '#00b3ff' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (timeRange !== range.value) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (timeRange !== range.value) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }
              }}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: '400px' }}>
        <Line data={chartData} options={options} />
      </div>

      {/* Stats Footer */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
            Total Predictions
          </div>
          <div style={{ color: '#00b3ff', fontSize: '1.25rem', fontWeight: '600' }}>
            {predictions.length}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
            Avg Confidence
          </div>
          <div style={{ color: '#00b3ff', fontSize: '1.25rem', fontWeight: '600' }}>
            {predictions.length > 0
              ? ((predictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / predictions.length) * 100).toFixed(1)
              : '0'}%
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
            Time Range
          </div>
          <div style={{ color: '#fff', fontSize: '1.25rem', fontWeight: '600' }}>
            {timeRange.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIPredictionChart;
