import React, { useState, useEffect, useCallback } from 'react';
import { useDataFetch } from '../hooks/useDataFetch';
import { mempoolApi } from '../services/apiClient';
import { Card, LoadingSpinner } from './ui';
import styles from './PredictedNextBlock.module.css';

function PredictedNextBlock() {
  const [timeRemaining, setTimeRemaining] = useState(600);

  const { data: mempoolData, loading, error } = useDataFetch(
    () => mempoolApi.getStats(),
    {
      pollInterval: 15000, // 15 seconds
      cacheKey: 'mempool-stats'
    }
  );

  const safeToFixed = (val, digits = 2) =>
    val != null && !isNaN(val) ? val.toFixed(digits) : 'N/A';

  const formatNumber = (num, decimals = 0) => {
    if (num == null || isNaN(num)) return 'N/A';
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toFixed(decimals);
  };

  const formatTime = (seconds) => {
    if (seconds <= 0) return 'Any moment...';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs.toString().padStart(2, '0')}s` : `${secs}s`;
  };

  // Countdown timer
  useEffect(() => {
    if (!mempoolData?.nextBlock?.estimatedTime) return;
    let animationFrameId;
    let lastUpdateTime = Date.now();
    let remaining = mempoolData.nextBlock.estimatedTime;

    const updateCountdown = () => {
      const now = Date.now();
      const delta = (now - lastUpdateTime) / 1000;
      lastUpdateTime = now;
      remaining = Math.max(0, remaining - delta);
      setTimeRemaining(Math.ceil(remaining));
      if (remaining > 0) animationFrameId = requestAnimationFrame(updateCountdown);
    };

    setTimeRemaining(Math.ceil(remaining));
    animationFrameId = requestAnimationFrame(updateCountdown);
    return () => cancelAnimationFrame(animationFrameId);
  }, [mempoolData?.nextBlock?.estimatedTime]);

  // Loading state
  if (loading && !mempoolData) {
    return (
      <Card className={styles.container}>
        <LoadingSpinner />
      </Card>
    );
  }

  // Error state
  if (error && !mempoolData) {
    return (
      <Card className={styles.container}>
        <div className={styles.errorState}>
          <h3 className={styles.errorTitle}>Error Loading Data</h3>
          <p className={styles.errorMessage}>{error.message || error}</p>
        </div>
      </Card>
    );
  }

  if (!mempoolData) return null;

  const { transactionCount, totalFees, totalFeesUSD, nextBlock } = mempoolData;

  return (
    <Card className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>Next Block Prediction</h3>
        <div className={styles.liveIndicator}>
          <div className={styles.liveDot} />
          <span className={styles.liveText}>LIVE</span>
        </div>
      </div>

      {/* Mempool Overview */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Pending Transactions</div>
          <div className={styles.statValue}>{formatNumber(transactionCount)}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Fees (BTC)</div>
          <div className={styles.statValue}>{safeToFixed(totalFees, 4)}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Fees (USD)</div>
          <div className={`${styles.statValue} ${styles.highlight}`}>
            ${formatNumber(totalFeesUSD, 2)}
          </div>
        </div>
      </div>

      {/* Next Block Prediction */}
      <div className={styles.predictionCard}>
        <div className={styles.predictionHeader}>
          <div>
            <h4 className={styles.predictionLabel}>Estimated Time</h4>
            <div className={styles.countdown}>{formatTime(timeRemaining)}</div>
          </div>

          <div className={styles.transactionCount}>
            <div className={styles.predictionLabel}>Transactions</div>
            <div className={styles.largeValue}>
              {formatNumber(nextBlock?.transactionCount || 0)}
            </div>
          </div>
        </div>

        <div className={styles.feesGrid}>
          <div>
            <div className={styles.feeLabel}>Block Fees (BTC)</div>
            <div className={styles.feeValue}>
              {safeToFixed(nextBlock?.totalFees || 0, 6)}
            </div>
          </div>

          <div>
            <div className={styles.feeLabel}>Block Fees (USD)</div>
            <div className={`${styles.feeValue} ${styles.highlight}`}>
              ${formatNumber(nextBlock?.totalFeesUSD || 0, 2)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default PredictedNextBlock;
