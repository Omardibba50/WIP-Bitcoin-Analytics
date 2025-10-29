import React from 'react';
import { Bar } from 'react-chartjs-2';
import { formatModelsForChart, chartOptions } from '../utils/chartUtils';

function ModelChart({ models, loading }) {
  const chartData = formatModelsForChart(models);

  if (loading) {
    return (
      <div style={{
        background: 'rgba(30, 30, 40, 0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '1.5rem',
        height: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Loading models...</div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(30, 30, 40, 0.6)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '2rem'
    }}>
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        marginBottom: '1rem',
        color: '#ffffff'
      }}>
        Prediction Models
      </h3>
      <div style={{ height: '300px' }}>
        <Bar data={chartData} options={chartOptions.bar} />
      </div>
    </div>
  );
}

export default ModelChart;
