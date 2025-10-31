import React, { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { SkeletonChart } from './LoadingSpinner';
import BlockDetailModal from './BlockDetailModal';

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
      backgroundColor: 'rgba(0, 179, 255, 0.6)',
      borderColor: '#00b3ff',
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
      borderColor: '#4ade80',
      backgroundColor: 'rgba(74, 222, 128, 0.1)',
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#4ade80',
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#ccc' }
      }
    },
    scales: {
      x: {
        ticks: { color: '#888' },
        grid: { color: '#333' }
      },
      y: {
        ticks: { color: '#888' },
        grid: { color: '#333' }
      }
    }
  };

  if (loading && blocks.length === 0) {
    return (
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ 
          color: '#00b3ff', 
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
      <div style={{ padding: '2rem', textAlign: 'center', color: '#ff6b6b' }}>
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
          color: '#00b3ff', 
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          Latest Blockchain Blocks
        </h2>
        <div style={{ 
          fontSize: '0.9rem', 
          color: '#888',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: loading ? '#ffa500' : '#4ade80'
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
          backgroundColor: '#1a1a1a',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1rem',
            color: '#ccc'
          }}>
            Block Sizes
          </h3>
          <div style={{ height: '200px' }}>
            <Bar data={blockSizeChartData} options={chartOptions} />
          </div>
        </div>

        {/* Transaction Count Chart */}
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1rem',
            color: '#ccc'
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
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #333',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '100px 1fr 120px 100px 100px 150px',
          gap: '1rem',
          padding: '1rem 1.5rem',
          backgroundColor: '#252525',
          fontWeight: 'bold',
          fontSize: '0.85rem',
          color: '#888',
          borderBottom: '1px solid #333'
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
              borderBottom: idx < blocks.length - 1 ? '1px solid #333' : 'none',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#252525';
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
            onClick={() => setSelectedBlock(block)}
          >
            <div style={{ 
              color: '#00b3ff', 
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}>
              {block.height}
            </div>
            <div style={{ 
              color: '#ccc',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {block.hash}
            </div>
            <div style={{ color: '#888', fontSize: '0.9rem' }}>
              {timeAgo(block.timestamp)}
            </div>
            <div style={{ color: '#ccc' }}>
              {formatSize(block.size)}
            </div>
            <div style={{ 
              color: '#4ade80',
              fontWeight: 'bold'
            }}>
              {block.tx_count}
            </div>
            <div style={{ 
              color: '#888',
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
