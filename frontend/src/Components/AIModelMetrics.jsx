import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useDataFetch } from '../hooks/useDataFetch';
import { aiApi } from '../services/apiClient';
import { Card, LoadingSpinner } from './ui';
import { createDoughnutChart, createBarChart } from '../utils/chartFactory';
import styles from './AIModelMetrics.module.css';

function AIModelMetrics() {
  const { data: metrics, loading, error } = useDataFetch(
    () => aiApi.getModelMetrics(),
    {
      pollInterval: 600000, // 10 minutes
      cacheKey: 'ai-model-metrics'
    }
  );

  // Loading state
  if (loading && !metrics) {
    return (
      <Card className={styles.container}>
        <LoadingSpinner />
      </Card>
    );
  }

  // Error state
  if (error && !metrics) {
    return (
      <Card className={`${styles.container} ${styles.error}`}>
        <div>Model metrics unavailable</div>
      </Card>
    );
  }

  if (!metrics) return null;

  const accuracy = metrics.performance?.directionalAccuracy || 0;
  const accuracyLabel = metrics.evaluation?.directional_accuracy_label || 'Unknown';

  // Accuracy Gauge Chart
  const gaugeChart = createDoughnutChart(
    ['Accuracy', 'Remaining'],
    [accuracy, 100 - accuracy],
    {
      colors: ['#00b3ff', 'rgba(255, 255, 255, 0.05)'],
      cutout: '70%',
      plugins: {
        legend: { display: false },
        title: { display: false }
      }
    }
  );

  // Performance Metrics Bar Chart
  const labels = ['MAE', 'Loss', 'MAPE'];
  const performanceChart = createBarChart(
    [{
      label: 'Score',
      data: [
        (metrics.performance?.testMAE || 0) * 1000,
        (metrics.performance?.testLoss || 0) * 100000,
        (metrics.performance?.testMAPE || 0) / 10
      ],
      backgroundColor: [
        'rgba(0, 179, 255, 0.8)',
        'rgba(0, 255, 136, 0.8)',
        'rgba(255, 170, 0, 0.8)'
      ]
    }],
    labels,
    {
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        title: { display: false }
      }
    }
  );

  return (
    <Card className={styles.container}>
      {/* Header */}
      <h3 className={styles.title}>Model Performance Metrics</h3>

      {/* Two Column Layout */}
      <div className={styles.gridLayout}>
        {/* Left Column: Model Info & Accuracy */}
        <div>
          {/* Model Information */}
          <div className={styles.infoCard}>
            <h4 className={styles.sectionTitle}>Model Information</h4>
            <div className={styles.infoRows}>
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
          <div className={styles.gaugeCard}>
            <h4 className={styles.sectionTitle}>Directional Accuracy</h4>
            <div className={styles.gaugeContainer}>
              <Doughnut data={gaugeChart.data} options={gaugeChart.options} />
              <div className={styles.gaugeCenter}>
                <div className={styles.gaugeValue}>{accuracy.toFixed(1)}%</div>
                <div className={styles.gaugeLabel}>{accuracyLabel}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Performance Metrics */}
        <div>
          {/* Performance Bar Chart */}
          <div className={styles.performanceCard}>
            <h4 className={styles.sectionTitle}>Error Metrics</h4>
            <div className={styles.chartContainer}>
              <Bar data={performanceChart.data} options={performanceChart.options} />
            </div>
          </div>

          {/* Detailed Stats Grid */}
          <div className={styles.statsGrid}>
            <StatCard
              label="Test MAE"
              value={(metrics.performance?.testMAE * 100 || 0).toFixed(4)}
            />
            <StatCard
              label="Test Loss"
              value={(metrics.performance?.testLoss || 0).toExponential(4)}
            />
            <StatCard
              label="Test MAPE"
              value={(metrics.performance?.testMAPE || 0).toFixed(2)}
            />
            <StatCard
              label="Val Loss"
              value={(metrics.performance?.bestValLoss || 0).toExponential(4)}
            />
          </div>

          {/* Features Info */}
          <div className={styles.featuresCard}>
            <h4 className={styles.sectionTitle}>Feature Engineering</h4>
            <div className={styles.featuresGrid}>
              <div className={styles.featureItem}>
                <div className={styles.featureLabel}>Features</div>
                <div className={styles.featureValue}>{metrics.features?.count || 10}</div>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureLabel}>Timesteps</div>
                <div className={styles.featureValue}>{metrics.features?.timesteps || 60}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Helper Components
function InfoRow({ label, value }) {
  return (
    <div className="infoRow">
      <span className="infoLabel">{label}:</span>
      <span className="infoValue">{value}</span>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="statCard">
      <div className="statLabel">{label}</div>
      <div className="statValue">{value}</div>
    </div>
  );
}

export default AIModelMetrics;
