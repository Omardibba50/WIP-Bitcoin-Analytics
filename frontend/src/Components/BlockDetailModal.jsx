import React from 'react';
import styles from './BlockDetailModal.module.css';

/**
 * Block Detail Modal Component
 * Displays detailed information about a specific Bitcoin block
 */
function BlockDetailModal({ block, onClose }) {
  if (!block) return null;

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Block #{block.height}</h2>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Block Details */}
        <div className={styles.content}>
          {/* Hash */}
          <div className={styles.section}>
            <div className={styles.label}>Block Hash</div>
            <div className={styles.hashValue}>{block.hash}</div>
          </div>

          {/* Timestamp & Height */}
          <div className={styles.gridTwo}>
            <div className={styles.section}>
              <div className={styles.label}>Timestamp</div>
              <div className={styles.value}>{formatTime(block.timestamp)}</div>
            </div>
            <div className={styles.section}>
              <div className={styles.label}>Block Height</div>
              <div className={styles.highlightValue}>{block.height.toLocaleString()}</div>
            </div>
          </div>

          {/* Size & Transactions */}
          <div className={styles.gridTwo}>
            <div className={styles.section}>
              <div className={styles.label}>Block Size</div>
              <div className={styles.successValue}>{formatSize(block.size)}</div>
            </div>
            <div className={styles.section}>
              <div className={styles.label}>Transactions</div>
              <div className={styles.successValue}>{block.tx_count.toLocaleString()}</div>
            </div>
          </div>

          {/* Miner */}
          <div className={styles.section}>
            <div className={styles.label}>Mined By</div>
            <div className={styles.minerValue}>{block.miner}</div>
          </div>

          {/* Additional Info */}
          <div className={styles.statsBox}>
            <div className={styles.label}>Block Statistics</div>
            <div className={styles.statsList}>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Avg Transaction Size:</span>
                <span className={styles.statValue}>
                  {formatSize(block.size / block.tx_count)}
                </span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Block Utilization:</span>
                <span className={styles.statValue}>
                  {((block.size / (4 * 1024 * 1024)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* External Links */}
          <div className={styles.linksRow}>
            <a
              href={`https://mempool.space/block/${block.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.link} ${styles.linkPrimary}`}
            >
              View on Mempool.space
            </a>
            <a
              href={`https://blockchain.com/btc/block/${block.height}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.link} ${styles.linkSecondary}`}
            >
              View on Blockchain.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlockDetailModal;
