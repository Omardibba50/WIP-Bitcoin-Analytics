import React from 'react';
import { Card } from '../components/ui';
import { LoadingSpinner } from '../components/ui';
import { formatNumber, formatCurrency } from '../utils/formatters';
import styles from './LightningNetwork.module.css';

function LightningNetwork({ lightningStats, loading }) {
  if (loading) {
    return (
      <Card className={styles.container}>
        <h3 className={styles.title}>Lightning Network</h3>
        <LoadingSpinner />
      </Card>
    );
  }

  if (!lightningStats) return null;

  const stats = [
    {
      label: 'Total Capacity',
      value: `${formatNumber(lightningStats.totalCapacity, 2)} BTC`,
      subValue: lightningStats.totalCapacityUSD ? formatCurrency(lightningStats.totalCapacityUSD, { maximumFractionDigits: 0 }) : null
    },
    {
      label: 'Total Nodes',
      value: lightningStats.totalNodes.toLocaleString(),
      subValue: `${lightningStats.torNodes.toLocaleString()} Tor nodes`
    },
    {
      label: 'Total Channels',
      value: lightningStats.totalChannels.toLocaleString(),
      subValue: `Avg: ${formatNumber(lightningStats.avgChannelSize, 4)} BTC`
    },
    {
      label: 'Tor Capacity',
      value: `${formatNumber(lightningStats.torCapacity, 2)} BTC`,
      subValue: `${lightningStats.torCapacityPercentage.toFixed(1)}% of total`
    }
  ];

  return (
    <Card className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Lightning Network Statistics</h3>
        <span className={styles.badge}>Real-time data</span>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {stats.map((stat, index) => (
          <div key={index} className={styles.statCard}>
            <div className={styles.statLabel}>{stat.label}</div>
            <div className={styles.statValue}>{stat.value}</div>
            {stat.subValue && (
              <div className={styles.statSubValue}>{stat.subValue}</div>
            )}
          </div>
        ))}
      </div>

      {/* Additional Info */}
      <div className={styles.additionalInfo}>
        <div className={styles.additionalGrid}>
          <div>
            <div className={styles.infoLabel}>Avg Node Capacity</div>
            <div className={styles.infoValue}>
              {formatNumber(lightningStats.avgCapacity, 4)} BTC
            </div>
          </div>
          <div>
            <div className={styles.infoLabel}>Median Capacity</div>
            <div className={styles.infoValue}>
              {formatNumber(lightningStats.medianCapacity, 4)} BTC
            </div>
          </div>
          <div>
            <div className={styles.infoLabel}>Clearnet Nodes</div>
            <div className={styles.infoValue}>
              {lightningStats.clearnetNodes.toLocaleString()}
            </div>
          </div>
          <div>
            <div className={styles.infoLabel}>Unannounced Nodes</div>
            <div className={styles.infoValue}>
              {lightningStats.unannouncedNodes.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default LightningNetwork;
