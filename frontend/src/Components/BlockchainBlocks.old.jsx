import React, { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { SkeletonChart } from '../components/ui/Skeleton';
import BlockDetailModal from './BlockDetailModal';
import { colors, spacing, borderRadius, shadows } from '../styles/designSystem';
import { getChartOptions, chartColors, getDatasetConfig } from '../utils/chartConfig';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function BlockchainBlocks() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/blocks/latest?limit=10`);
        if (!response.ok) throw new Error('Failed to fetch blocks');
        const data = await response.json();
        setBlocks(data.data || []);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlocks();
    const interval = setInterval(fetchBlocks, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Format time ago
  const timeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Format block size
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Prepare chart data for block sizes
  const blockSizeChartData = {
    labels: blocks.map(b => `#${b.height}`),
    datasets: [{
      label: 'Block Size (MB)',
      data: blocks.map(b => (b.size / (1024 * 1024)).toFixed(2)),
      backgroundColor: chartColors.primary + '99',
      borderColor: chartColors.primary,
      borderWidth: 2,
      borderRadius: 6,
    }]
  };

  // Prepare chart data for transaction counts
  const txCountChartData = {
    labels: blocks.map(b => `#${b.height}`),
    datasets: [{
      label: 'Transactions',
      data: blocks.map(b => b.tx_count),
      fill: false,
      borderColor: chartColors.success,
      backgroundColor: colors.textPrimary,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: chartColors.success,
    }]
  };

  const chartOptions = getChartOptions('bar');

  if (loading && blocks.length === 0) {
    return (
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ 
          color: colors.textPrimary, 
          margin: '0 0 1rem 0',
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          Latest Blockchain Blocks
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <SkeletonChart height="200px" />
          <SkeletonChart height="200px" />
        </div>
        <SkeletonChart height="300px" />
      </div>
    );
  }

  if (error && blocks.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: colors.error }}>
        Error loading blocks: {error}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h2 style={{ 
          color: colors.textPrimary, 
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          Latest Blockchain Blocks
        </h2>
        <div style={{ 
          fontSize: '0.9rem', 
          color: colors.textSecondary,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: loading ? colors.warning : colors.success
          }} />
          {loading ? 'Updating...' : 'Live'}
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Block Size Chart */}
        <div style={{
          backgroundColor: colors.cardBg,
          padding: '1.5rem',
          borderRadius: borderRadius.md,
          border: `1px solid ${colors.border}`
        }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1rem',
            color: colors.textPrimary
          }}>
            Block Sizes
          </h3>
          <div style={{ height: '200px' }}>
            <Bar data={blockSizeChartData} options={chartOptions} />
          </div>
        </div>

        {/* Transaction Count Chart */}
        <div style={{
          backgroundColor: colors.cardBg,
          padding: '1.5rem',
          borderRadius: borderRadius.md,
          border: `1px solid ${colors.border}`
        }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1rem',
            color: colors.textPrimary
          }}>
            Transaction Counts
          </h3>
          <div style={{ height: '200px' }}>
            <Line data={txCountChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Blocks List */}
      <div style={{
        backgroundColor: colors.cardBg,
        borderRadius: borderRadius.md,
        border: `1px solid ${colors.border}`,
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '100px 1fr 120px 100px 100px 150px',
          gap: '1rem',
          padding: '1rem 1.5rem',
          backgroundColor: colors.bgSecondary,
          fontWeight: 'bold',
          fontSize: '0.85rem',
          color: colors.textSecondary,
          borderBottom: `1px solid ${colors.border}`
        }}>
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
            style={{
              display: 'grid',
              gridTemplateColumns: '100px 1fr 120px 100px 100px 150px',
              gap: '1rem',
              padding: '1rem 1.5rem',
              borderBottom: idx < blocks.length - 1 ? `1px solid ${colors.border}` : 'none',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bgSecondary;
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
            onClick={() => setSelectedBlock(block)}
          >
            <div style={{ 
              color: colors.accent, 
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}>
              {block.height}
            </div>
            <div style={{ 
              color: colors.textSecondary,
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {block.hash}
            </div>
            <div style={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
              {timeAgo(block.timestamp)}
            </div>
            <div style={{ color: colors.textPrimary }}>
              {formatSize(block.size)}
            </div>
            <div style={{ 
              color: colors.textPrimary,
              fontWeight: 'bold'
            }}>
              {block.tx_count}
            </div>
            <div style={{ 
              color: colors.textSecondary,
              fontSize: '0.85rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {block.miner}
            </div>
          </div>
        ))}
      </div>

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
