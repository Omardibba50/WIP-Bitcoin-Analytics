import React from 'react';
import { Bar } from 'react-chartjs-2';
import { useDataFetch } from '../hooks/useDataFetch';
import { aiApi } from '../services/apiClient';
import { createBarChart } from '../utils/chartFactory';
import { Card, LoadingSpinner } from './ui';
import { colors } from '../styles/designSystem';
import styles from './LiveModelsChart.module.css';

/**
 * Live Models Chart Component - Refactored
 * Displays real-time model accuracy and details
 * 
 * Features:
 * - useDataFetch with 60s polling
 * - chartFactory for consistent styling
 * - CSS modules
 */
export default function LiveModelsChart() {
  // Fetch models with 60s polling
  const { data: response, loading, error, refetch } = useDataFetch(
    () => aiApi.getModelsLive(),
    {
      interval: 60 * 1000, // 60 seconds
      priority: 'secondary'
    }
  );

  // Extract models from response with comprehensive validation
  let models = null;
  
  if (response) {
    console.log('LiveModelsChart - Response received:', response);
    
    if (Array.isArray(response.data)) {
      models = response.data;
    } else if (response.data && typeof response.data === 'object') {
      models = [response.data];
    } else if (Array.isArray(response)) {
      models = response;
    }
    
    console.log('LiveModelsChart - Processed models:', models);
  }

  if (loading && (!models || models.length === 0)) {
    return (
      <Card className={styles.container}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="medium" />
          <p>Loading live model data...</p>
        </div>
      </Card>
    );
  }

  if (error && (!models || models.length === 0)) {
    return (
      <Card className={styles.container}>
        <div className={styles.errorContainer}>
          <p>Error: {error.message}</p>
          <button onClick={refetch} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </Card>
    );
  }

  if (!models || models.length === 0) {
    return (
      <Card className={styles.container}>
        <div className={styles.noData}>
          <p>No model data available</p>
        </div>
      </Card>
    );
  }

  // Prepare chart data
  console.log('LiveModelsChart - Creating chart with models:', models);
  
  const labels = models.map(m => m?.name || 'Unknown');
  const datasets = [
    {
      label: 'Model Accuracy (%)',
      data: models.map(m => {
        const accuracy = Number(m?.accuracy || 0);
        return isNaN(accuracy) ? 0 : (accuracy * 100).toFixed(2);
      }),
      backgroundColor: [colors.primary || '#00b3ff', colors.primaryDark || '#0080ff', colors.info || '#3b82f6'],
      borderRadius: 8,
    },
  ];

  console.log('LiveModelsChart - Chart labels:', labels);
  console.log('LiveModelsChart - Chart datasets:', datasets);

  // Validate chart data before creating chart
  if (!Array.isArray(datasets) || !Array.isArray(labels)) {
    console.error('LiveModelsChart - Invalid chart data:', { datasets, labels });
    return (
      <Card className={styles.container}>
        <div className={styles.errorContainer}>
          <p>Invalid chart data format</p>
        </div>
      </Card>
    );
  }

  // Create chart configuration using chartFactory
  console.log('LiveModelsChart - Calling createBarChart with:', { datasets, labels });
  
  let chartConfig;
  try {
    chartConfig = createBarChart(datasets, labels, {
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Accuracy (%)',
          },
        },
      },
    });
    console.log('LiveModelsChart - Chart config created:', chartConfig);
  } catch (err) {
    console.error('LiveModelsChart - Error creating chart:', err);
    return (
      <Card className={styles.container}>
        <div className={styles.errorContainer}>
          <p>Error creating chart: {err.message}</p>
        </div>
      </Card>
    );
  }

  if (!chartConfig || !chartConfig.data) {
    console.error('LiveModelsChart - Invalid chart config:', chartConfig);
    return (
      <Card className={styles.container}>
        <div className={styles.errorContainer}>
          <p>Chart configuration is invalid</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={styles.container}>
      {/* Chart Section */}
      <div className={styles.chartContainer}>
        <Bar data={chartConfig.data} options={chartConfig.options} />
      </div>

      {/* Details Table */}
      <div className={styles.tableContainer}>
        <h4 className={styles.tableTitle}>Model Details (Live)</h4>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Accuracy (%)</th>
                <th>Updated At</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.id}>
                  <td>{m.id}</td>
                  <td className={styles.nameCell}>{m.name}</td>
                  <td className={styles.descCell}>{m.description}</td>
                  <td className={styles.accuracyCell}>
                    {(Number(m.accuracy) * 100).toFixed(2)}%
                  </td>
                  <td className={styles.timeCell}>
                    {new Date(m.updated_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
