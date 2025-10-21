import React from 'react';

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
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '2rem'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          border: '1px solid #333',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          padding: '2rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #333'
        }}>
          <h2 style={{ 
            margin: 0, 
            color: '#00b3ff',
            fontSize: '1.5rem'
          }}>
            Block #{block.height}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* Block Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Hash */}
          <div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#888', 
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              fontWeight: '600'
            }}>
              Block Hash
            </div>
            <div style={{ 
              color: '#ccc',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              wordBreak: 'break-all',
              backgroundColor: '#0f0f0f',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #333'
            }}>
              {block.hash}
            </div>
          </div>

          {/* Timestamp */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '1rem' 
          }}>
            <div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#888', 
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                fontWeight: '600'
              }}>
                Timestamp
              </div>
              <div style={{ color: '#ccc', fontSize: '0.9rem' }}>
                {formatTime(block.timestamp)}
              </div>
            </div>

            <div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#888', 
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                fontWeight: '600'
              }}>
                Block Height
              </div>
              <div style={{ 
                color: '#00b3ff', 
                fontSize: '1.2rem',
                fontWeight: 'bold'
              }}>
                {block.height.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Size and Transactions */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '1rem' 
          }}>
            <div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#888', 
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                fontWeight: '600'
              }}>
                Block Size
              </div>
              <div style={{ 
                color: '#4ade80', 
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}>
                {formatSize(block.size)}
              </div>
            </div>

            <div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#888', 
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                fontWeight: '600'
              }}>
                Transactions
              </div>
              <div style={{ 
                color: '#4ade80', 
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}>
                {block.tx_count.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Miner */}
          <div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#888', 
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              fontWeight: '600'
            }}>
              Mined By
            </div>
            <div style={{ 
              color: '#fbbf24',
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              {block.miner}
            </div>
          </div>

          {/* Additional Info */}
          <div style={{
            backgroundColor: '#0f0f0f',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #333'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#888', 
              marginBottom: '0.75rem',
              textTransform: 'uppercase',
              fontWeight: '600'
            }}>
              Block Statistics
            </div>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>Avg Transaction Size:</span>
                <span style={{ color: '#ccc' }}>
                  {formatSize(block.size / block.tx_count)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>Block Utilization:</span>
                <span style={{ color: '#ccc' }}>
                  {((block.size / (4 * 1024 * 1024)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* External Links */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid #333'
          }}>
            <a
              href={`https://mempool.space/block/${block.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#00b3ff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}
            >
              View on Mempool.space
            </a>
            <a
              href={`https://blockchain.com/btc/block/${block.height}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#333',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}
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
