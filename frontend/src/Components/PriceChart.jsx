import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { formatPriceHistoryForChart, chartOptions } from '../utils/chartUtils';

function PriceChart({ priceHistory, loading, onTimeRangeChange }) {
  const [timeRange, setTimeRange] = useState('30d');
  
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    if (onTimeRangeChange) {
      onTimeRangeChange(range);
    }
  };
  
  const chartData = formatPriceHistoryForChart(priceHistory);

  if (loading) {
    return (
      <div style={{
        background: 'rgba(30, 30, 40, 0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '1.5rem',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Loading chart...</div>
      </div>
    );
  }

  const timeRanges = [
    { label: '7D', value: '7d', days: 7 },
    { label: '30D', value: '30d', days: 30 },
    { label: '90D', value: '90d', days: 90 },
    { label: '1Y', value: '1y', days: 365 },
    { label: 'ALL', value: 'all', days: null }
  ];

  return (
    <div style={{
      background: 'rgba(30, 30, 40, 0.6)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
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
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#ffffff',
          margin: 0
        }}>
          Price History
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {timeRanges.map(range => (
            <button
              key={range.value}
              onClick={() => handleTimeRangeChange(range.value)}
              style={{
                padding: '0.4rem 0.8rem',
                background: timeRange === range.value ? '#00b3ff' : 'rgba(255, 255, 255, 0.1)',
                color: timeRange === range.value ? '#000' : '#fff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (timeRange !== range.value) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (timeRange !== range.value) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }
              }}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: '400px' }}>
        <Line data={chartData} options={chartOptions.line} />
      </div>
    </div>
  );
}

export default PriceChart;
