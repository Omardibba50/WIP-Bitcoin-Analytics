import React from 'react';
import { useDataFetch } from '../hooks/useDataFetch';
import { miningApi } from '../services/apiClient';
import { Card, LoadingSpinner } from './ui';
import styles from './MiningEconomics.module.css';

function MiningEconomics() {
  const { data: miningData, loading, error } = useDataFetch(
    () => miningApi.getEconomics(),
    {
      pollInterval: 300000, // 5 minutes
      cacheKey: 'mining-economics'
    }
  );

  const formatNumber = (num, decimals = 2) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(decimals)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(decimals)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };

  // Loading state
  if (loading && !miningData) {
    return (
      <div className={styles.container}>
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (error && !miningData) {
    return (
      <div className={styles.error}>
        <p>Error loading mining economics: {error.message || error}</p>
      </div>
    );
  }

  if (!miningData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>No mining economics data available.</p>
        </div>
      </div>
    );
  }

  const MetricCard = ({ label, value, subValue }) => (
    <Card className={styles.metricCard}>
      <div className={styles.metricTitle}>Mining Economics</div>
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricValue}>{value}</div>
      {subValue && <div className={styles.metricSubValue}>{subValue}</div>}
    </Card>
  );

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {/* Block Subsidy */}
        <MetricCard
          label="Block Subsidy"
          value={`${miningData.blockSubsidy.toFixed(3)} BTC`}
          subValue={`$${miningData.blockSubsidyValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        />

        {/* Average Fees per Block */}
        <MetricCard
          label="Avg. Fees per Block"
          value={`${miningData.avgFeesPerBlock > 0 ? miningData.avgFeesPerBlock.toFixed(4) : '0.0000'} BTC`}
          subValue={`${miningData.avgFeesVsReward}% of block reward`}
        />

        {/* Daily PHash/s Revenue */}
        <MetricCard
          label="Daily PHash/s Revenue"
          value={`${miningData.dailyPHashRevenueSats.toLocaleString()} sats`}
          subValue={`$${miningData.dailyPHashRevenueUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
        />

        {/* Network Hashrate */}
        <MetricCard
          label="Network Hashrate"
          value={`${miningData.networkHashrateEH ? miningData.networkHashrateEH.toFixed(2) : '0.00'} EH/s`}
          subValue={`${miningData.networkHashratePH ? formatNumber(miningData.networkHashratePH, 2) : '0'} PH/s`}
        />

        {/* Network Difficulty */}
        <MetricCard
          label="Network Difficulty"
          value={miningData.difficulty > 0 ? `${formatNumber(miningData.difficulty, 2)}T` : 'Loading...'}
          subValue={`~${miningData.blocksPerDay} blocks/day`}
        />
      </div>
    </div>
  );
}

export default MiningEconomics;
