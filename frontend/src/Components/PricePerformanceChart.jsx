import React from 'react';
import { Bar } from 'react-chartjs-2';
import { useDataFetch } from '../hooks/useDataFetch';
import { priceApi } from '../services/apiClient';
import { Card, LoadingSpinner } from './ui';
import { createBarChart } from '../utils/chartFactory';
import styles from './PricePerformanceChart.module.css';

export default function PricePerformanceChart() {
  const { data, loading, error } = useDataFetch(
    () => priceApi.getPerformance(),
    {
      pollInterval: 300000, // 5 minutes
      cacheKey: 'price-performance'
    }
  );

  // Loading state
  if (loading && !data) {
    return (
      <Card className={styles.container}>
        <LoadingSpinner />
      </Card>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <Card className={styles.container}>
        <div className={styles.error}>
          <p>Error loading price performance data</p>
        </div>
      </Card>
    );
  }

  if (!data || !data.performance) return null;

  // Prepare chart data
  const labels = data.performance.map(p => p.interval.toUpperCase());
  const chartConfig = createBarChart(
    [{
      label: 'Change (%)',
      data: data.performance.map(p => p.changePct),
      backgroundColor: data.performance.map(p => 
        p.changePct >= 0 ? 'rgba(74,222,128,0.6)' : 'rgba(255,107,107,0.6)'
      ),
    }],
    labels,
    {
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time Period',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Price Change (%)',
          },
          ticks: {
            callback: (value) => value.toFixed(1) + '%',
          },
        },
      },
    }
  );

  return (
    <Card className={styles.container}>
      <h3 className={styles.title}>
        Price Performance {data.source && `(${data.source})`}
      </h3>
      <div className={styles.chartContainer}>
        <Bar data={chartConfig.data} options={chartConfig.options} />
      </div>
    </Card>
  );
}
