import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function DifficultyChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchDifficultyData();
  }, [timeRange]);

  const fetchDifficultyData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/metrics/difficulty/history?timespan=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch difficulty data');
      const result = await response.json();
      setData(result.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = () => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Sample data for performance
    const samplingRate = Math.max(1, Math.floor(data.length / 200));
    const sampledData = data.filter((_, index) => index % samplingRate === 0);

    const labels = sampledData.map(item => {
      const date = new Date(item.timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? '2-digit' : undefined
      });
    });

    // Find difficulty adjustments (where adjustment_pct is not null)
    const adjustments = sampledData
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.adjustment_pct !== null && Math.abs(item.adjustment_pct) > 1);

    return {
      labels,
      datasets: [
        {
          label: 'Difficulty',
          data: sampledData.map(item => item.difficulty),
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          yAxisID: 'y',
          tension: 0.4,
          pointRadius: sampledData.map((item, index) => {
            // Highlight adjustment points
            const isAdjustment = adjustments.some(adj => adj.index === index);
            return isAdjustment ? 4 : 1;
          }),
          pointHoverRadius: 5,
          pointBackgroundColor: sampledData.map((item, index) => {
            const adj = adjustments.find(a => a.index === index);
            if (adj) {
              return adj.item.adjustment_pct > 0 ? '#10b981' : '#ef4444';
            }
            return '#f97316';
          }),
          borderWidth: 2,
        },
        {
          label: 'BTC Price (USD)',
          data: sampledData.map(item => item.price),
          borderColor: '#00b3ff',
          backgroundColor: 'rgba(0, 179, 255, 0.1)',
          yAxisID: 'y1',
          tension: 0.4,
          pointRadius: 1,
          pointHoverRadius: 5,
          borderWidth: 2,
        }
      ]
    };
  };

  const chartOptions = {
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
          color: '#000000',
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#000000',
        bodyColor: '#000000',
        borderColor: '#ddd',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.datasetIndex === 0) {
                // Difficulty - format in trillions
                const value = context.parsed.y / 1000000000000;
                label += value.toFixed(2) + 'T';
                
                // Add adjustment percentage if available
                const dataPoint = data[context.dataIndex * Math.max(1, Math.floor(data.length / 200))];
                if (dataPoint && dataPoint.adjustment_pct !== null) {
                  label += ` (${dataPoint.adjustment_pct > 0 ? '+' : ''}${dataPoint.adjustment_pct.toFixed(2)}%)`;
                }
              } else {
                // Price
                label += '$' + context.parsed.y.toLocaleString(undefined, { maximumFractionDigits: 2 });
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#000000', maxRotation: 45, minRotation: 0 },
        grid: { color: 'rgba(0, 0, 0, 0.05)' }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Difficulty (T)',
          color: '#f97316',
          font: { size: 12, weight: 'bold' }
        },
        ticks: { 
          color: '#f97316',
          callback: function(value) {
            return (value / 1000000000000).toFixed(1) + 'T';
          }
        },
        grid: { color: 'rgba(249, 115, 22, 0.1)' }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'BTC Price (USD)',
          color: '#00b3ff',
          font: { size: 12, weight: 'bold' }
        },
        ticks: { 
          color: '#00b3ff',
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        },
        grid: { drawOnChartArea: false }
      }
    }
  };

  const timeRanges = [
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' },
    { label: '1Y', value: '1y' },
    { label: 'ALL', value: 'all' }
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
        marginBottom: '1rem'
      }}>
        <div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#000000',
            margin: 0,
            marginBottom: '0.25rem'
          }}>
            Mining Difficulty vs BTC Price
          </h3>
          <p style={{
            fontSize: '0.75rem',
            color: '#666',
            margin: 0
          }}>
            Green dots = difficulty increase, Red dots = difficulty decrease
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {timeRanges.map(range => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              style={{
                padding: '0.4rem 0.8rem',
                background: timeRange === range.value ? '#00b3ff' : 'rgba(0, 0, 0, 0.05)',
                color: timeRange === range.value ? '#ffffff' : '#000000',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (timeRange !== range.value) {
                  e.currentTarget.style.background = 'rgba(0, 179, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (timeRange !== range.value) {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                }
              }}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{
          height: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666'
        }}>
          Loading difficulty data...
        </div>
      )}

      {error && !loading && (
        <div style={{
          height: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ff6b6b'
        }}>
          Error: {error}
        </div>
      )}

      {!loading && !error && data.length === 0 && (
        <div style={{
          height: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666'
        }}>
          No data available
        </div>
      )}

      {!loading && !error && data.length > 0 && (
        <div style={{ height: '400px' }}>
          <Line data={formatChartData()} options={chartOptions} />
        </div>
      )}
    </div>
  );
}

export default DifficultyChart;
