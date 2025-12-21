import React, { useEffect, useState } from 'react';
import { useDataFetch } from '../hooks/useDataFetch';
import { aiApi } from '../services/apiClient';
import { Card, LoadingSpinner } from './ui';
import styles from './AIPredictionCard.module.css';

function AIPredictionCard() {
  const [timeToNext, setTimeToNext] = useState('');

  const { data: prediction, loading: predLoading, error: predError } = useDataFetch(
    () => aiApi.getLatestPrediction().then(res => res?.prediction || res),
    {
      pollInterval: 300000, // 5 minutes
      cacheKey: 'ai-prediction-latest'
    }
  );

  const { data: status } = useDataFetch(
    () => aiApi.getStatus(),
    {
      pollInterval: 60000, // 1 minute
      cacheKey: 'ai-status'
    }
  );

  // Calculate time to next prediction
  useEffect(() => {
    if (!status?.polling?.next_prediction) return;
    
    const updateTimer = () => {
      const nextTime = new Date(status.polling.next_prediction).getTime();
      const now = Date.now();
      const diff = nextTime - now;
      
      if (diff <= 0) {
        setTimeToNext('Generating...');
        return;
      }
      
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeToNext(`${minutes}m ${seconds}s`);
    };
    
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [status]);

  // Loading state
  if (predLoading && !prediction) {
    return (
      <Card className={styles.container}>
        <LoadingSpinner />
      </Card>
    );
  }

  // Error state
  if (predError && !prediction) {
    return (
      <Card className={styles.containerError}>
        <div className={styles.errorMessage}>Error: {predError.message || predError}</div>
        <div className={styles.errorHint}>AI service may be initializing. Please wait...</div>
      </Card>
    );
  }

  if (!prediction) return null;

  const isOperational = status?.status === 'operational';
  const changePercent = prediction?.predicted_change_percent || 0;
  const confidence = (prediction?.confidence || 0) * 100;
  const isPositive = changePercent > 0;

  return (
    <Card className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>AI Price Prediction</h3>
        <div className={`${styles.badge} ${isOperational ? styles.live : styles.init}`}>
          {isOperational ? '● LIVE' : '○ INITIALIZING'}
        </div>
      </div>

      {/* Prediction Content */}
      <div className={styles.pricesGrid}>
        {/* Current Price */}
        <div>
          <div className={styles.label}>Current Price</div>
          <div className={styles.value}>
            ${prediction?.current_price?.toLocaleString() || '---'}
          </div>
        </div>

        {/* Predicted Price */}
        <div>
          <div className={styles.label}>Predicted (1h)</div>
          <div className={`${styles.value} ${styles.predicted}`}>
            ${prediction?.predicted_price?.toLocaleString() || '---'}
            <span className={`${styles.change} ${isPositive ? styles.positive : ''}`}>
              {isPositive ? '↑' : '↓'} {Math.abs(changePercent).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Confidence Bar */}
      <div className={styles.confidenceSection}>
        <div className={styles.confidenceHeader}>
          <span className={styles.confidenceLabel}>Confidence Score</span>
          <span className={styles.confidenceValue}>{confidence.toFixed(1)}%</span>
        </div>
        <div className={styles.confidenceBarBg}>
          <div 
            className={styles.confidenceBar}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className={styles.footer}>
        <div className={styles.modelInfo}>Model: LSTM v1.0</div>
        <div className={styles.nextPrediction}>Next: {timeToNext}</div>
      </div>
    </Card>
  );
}

export default AIPredictionCard;
