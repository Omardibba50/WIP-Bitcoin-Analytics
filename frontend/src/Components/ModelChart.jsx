import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Card, LoadingSpinner } from './ui';
import { createBarChart } from '../utils/chartFactory';
import { formatModelsForChart } from '../utils/chartUtils';
import styles from './ModelChart.module.css';

function ModelChart({ models, loading }) {
  if (loading) {
    return (
      <Card className={styles.container}>
        <LoadingSpinner />
      </Card>
    );
  }

  const chartData = formatModelsForChart(models);
  const labels = chartData.labels || [];
  const datasets = chartData.datasets || [];
  const chart = createBarChart(datasets, labels, { 
    plugins: {
      title: { display: false }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Model Name',
        },
      },
      y: {
        beginAtZero: true,
        max: 1,
        title: {
          display: true,
          text: 'Accuracy',
        },
        ticks: {
          callback: (value) => (value * 100).toFixed(0) + '%',
        },
      },
    },
  });

  return (
    <Card className={styles.container}>
      <h3 className={styles.title}>Prediction Models</h3>
      <div className={styles.chartContainer}>
        <Bar data={chart.data} options={chart.options} />
      </div>
    </Card>
  );
}

export default ModelChart;
