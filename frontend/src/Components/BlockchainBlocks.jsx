import React, { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { useDataFetch } from '../hooks/useDataFetch';
import { blockApi } from '../services/apiClient';
import { Card, LoadingSpinner } from './ui';
import { createBarChart, createLineChart } from '../utils/chartFactory';
import BlockDetailModal from './BlockDetailModal';
import styles from './BlockchainBlocks.module.css';

function BlockchainBlocks() {
  const [selectedBlock, setSelectedBlock] = useState(null);

  const { data: blocks, loading, error } = useDataFetch(
    () => blockApi.getLatest(10),
    {
      pollInterval: 60000, // 1 minute
      cacheKey: 'blocks-latest'
    }
  );

  const timeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Loading state
  if (loading && (!blocks || blocks.length === 0)) {
    return (
      <div className={styles.container}>
        <h2 className={styles.header}>Latest Blockchain Blocks</h2>
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (error && (!blocks || blocks.length === 0)) {
    return (
      <div className={styles.container}>
        <h2 className={styles.header}>Latest Blockchain Blocks</h2>
        <div className={styles.error}>
          <p>Error loading blocks: {error.message || error}</p>
        </div>
      </div>
    );
  }

  if (!blocks || blocks.length === 0) return null;

  const labels = blocks.map(b => `#${b.height}`);

  // Prepare block size chart config
  const blockSizeConfig = createBarChart(
    [
      {
        label: 'Block Size (MB)',
        data: blocks.map(b => Number((b.size / (1024 * 1024)).toFixed(2))),
      },
    ],
    labels,
    { title: '' }
  );

  // Prepare transaction count chart config
  const txCountConfig = createLineChart(
    [
      {
        label: 'Transactions',
        data: blocks.map(b => b.tx_count),
      },
    ],
    labels,
    { title: '' }
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerContainer}>
        <h2 className={styles.header}>Latest Blockchain Blocks</h2>
        <div className={styles.statusIndicator}>
          <div className={`${styles.statusDot} ${loading ? styles.loading : styles.live}`} />
          {loading ? 'Updating...' : 'Live'}
        </div>
      </div>

      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Block Size Chart */}
        <Card className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Block Sizes</h3>
          <div className={styles.chartContainer}>
            <Bar data={blockSizeConfig.data} options={blockSizeConfig.options} />
          </div>
        </Card>

        {/* Transaction Count Chart */}
        <Card className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Transaction Counts</h3>
          <div className={styles.chartContainer}>
            <Line data={txCountConfig.data} options={txCountConfig.options} />
          </div>
        </Card>
      </div>

      {/* Blocks List */}
      <Card className={styles.blocksList}>
        <div className={styles.tableHeader}>
          <div>HEIGHT</div>
          <div>HASH</div>
          <div>TIME</div>
          <div>SIZE</div>
          <div>TXs</div>
          <div>MINER</div>
        </div>

        {blocks.map((block, idx) => (
          <div
            key={block.height}
            className={`${styles.tableRow} ${idx < blocks.length - 1 ? styles.withBorder : ''}`}
            onClick={() => setSelectedBlock(block)}
          >
            <div className={styles.blockHeight}>{block.height}</div>
            <div className={styles.blockHash}>{block.hash}</div>
            <div className={styles.blockTime}>{timeAgo(block.timestamp)}</div>
            <div className={styles.blockSize}>{formatSize(block.size)}</div>
            <div className={styles.blockTxCount}>{block.tx_count}</div>
            <div className={styles.blockMiner}>{block.miner}</div>
          </div>
        ))}
      </Card>

      {/* Block Detail Modal */}
      {selectedBlock && (
        <BlockDetailModal 
          block={selectedBlock} 
          onClose={() => setSelectedBlock(null)} 
        />
      )}
    </div>
  );
}

export default BlockchainBlocks;
