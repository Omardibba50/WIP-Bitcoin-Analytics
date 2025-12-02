import React from 'react';
import styles from './KeyMetrics.module.css';

/**
 * Key Metrics - Professional corporate metrics without emojis
 */
const KeyMetrics = ({ latestBlock, miningEconomics, lightningStats, models, hashrateHistory }) => {
  const blockHeight = latestBlock?.height || latestBlock?.block_height || 0;
  const blockTime = latestBlock?.timestamp ? new Date(latestBlock.timestamp * 1000).toLocaleTimeString() : '--:--';
  
  // Handle mining economics data - may come from different API shapes
  const hashrate = miningEconomics?.hashrate || miningEconomics?.network_hashrate || miningEconomics?.current_hashrate || 
                  (hashrateHistory && hashrateHistory.length > 0 ? hashrateHistory[hashrateHistory.length - 1]?.hashrate : 0) || 0;
  const difficulty = miningEconomics?.difficulty || miningEconomics?.current_difficulty || miningEconomics?.network_difficulty || latestBlock?.difficulty || 0;
  
  // Handle lightning stats - extract capacity and channels from backend response
  const lightningCapacity = lightningStats?.capacity_btc || lightningStats?.capacity || lightningStats?.totalCapacity || lightningStats?.total_capacity || 0;
  const lightningChannels = lightningStats?.channels || lightningStats?.totalChannels || lightningStats?.total_channels || 0;
  const lightningNodes = lightningStats?.nodes || lightningStats?.totalNodes || lightningStats?.total_nodes || 0;
  
  // Use the BTC value directly since backend already converts it
  const lightningCapacityBTC = lightningCapacity > 0 ? lightningCapacity.toString() : '0';
  
  // Handle models - array or object
  const activeModels = Array.isArray(models) ? models.length : (models && typeof models === 'object' ? Object.keys(models).length : 0);

  const formatHashrate = (hash) => {
    if (hash >= 1e18) return `${(hash / 1e18).toFixed(2)} EH/s`;
    if (hash >= 1e15) return `${(hash / 1e15).toFixed(2)} PH/s`;
    if (hash >= 1e12) return `${(hash / 1e12).toFixed(2)} TH/s`;
    return `${hash.toFixed(2)} H/s`;
  };

  const formatDifficulty = (diff) => {
    if (diff >= 1e12) return `${(diff / 1e12).toFixed(2)}T`;
    if (diff >= 1e9) return `${(diff / 1e9).toFixed(2)}B`;
    return diff.toLocaleString();
  };

  const metrics = [
    {
      label: 'Latest Block',
      value: blockHeight > 0 ? blockHeight.toLocaleString() : '—',
      subtitle: blockTime
    },
    {
      label: 'Network Hashrate',
      value: hashrate > 0 ? formatHashrate(hashrate) : '—',
      subtitle: 'Computing Power'
    },
    {
      label: 'Mining Difficulty',
      value: difficulty > 0 ? formatDifficulty(difficulty) : '—',
      subtitle: 'Current Epoch'
    },
    {
      label: 'AI Models Active',
      value: activeModels > 0 ? activeModels.toString() : '0',
      subtitle: 'Prediction Models'
    },
    {
      label: 'Lightning Network',
      value: lightningCapacityBTC > 0 ? `${lightningCapacityBTC} BTC` : '—',
      subtitle: lightningChannels > 0 && lightningNodes > 0 
        ? `${lightningChannels.toLocaleString()} Channels • ${lightningNodes.toLocaleString()} Nodes`
        : lightningChannels > 0 
          ? `${lightningChannels.toLocaleString()} Channels` 
          : 'No data'
    },
  ];

  return (
    <div className={styles.grid}>
      {metrics.map((metric, index) => (
        <div key={index} className={styles.card}>
          <div className={styles.content}>
            <div className={styles.label}>{metric.label}</div>
            <div className={styles.value}>{metric.value}</div>
            {metric.subtitle && (
              <div className={styles.subtitle}>{metric.subtitle}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KeyMetrics;
