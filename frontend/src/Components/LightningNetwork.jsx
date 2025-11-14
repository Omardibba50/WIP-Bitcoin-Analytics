import React from 'react';
import { formatNumber, formatCurrency } from '../utils/formatters';

function LightningNetwork({ lightningStats, loading }) {
  if (loading) {
    return (
      <div style={{
        background: '#ffffff',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#000000',
          marginBottom: '1rem'
        }}>
          ⚡ Lightning Network
        </h3>
        <p style={{ color: '#000000' }}>Loading Lightning Network data...</p>
      </div>
    );
  }

  if (!lightningStats) {
    return null;
  }

  const stats = [
    {
      label: 'Total Capacity',
      value: `${formatNumber(lightningStats.totalCapacity, 2)} BTC`,
      subValue: lightningStats.totalCapacityUSD ? formatCurrency(lightningStats.totalCapacityUSD, { maximumFractionDigits: 0 }) : null,
      icon: '💰',
      color: '#000000'
    },
    {
      label: 'Total Nodes',
      value: lightningStats.totalNodes.toLocaleString(),
      subValue: `${lightningStats.torNodes.toLocaleString()} Tor nodes`,
      icon: '🌐',
      color: '#000000'
    },
    {
      label: 'Total Channels',
      value: lightningStats.totalChannels.toLocaleString(),
      subValue: `Avg: ${formatNumber(lightningStats.avgChannelSize, 4)} BTC`,
      icon: '🔗',
      color: '#000000'
    },
    {
      label: 'Tor Capacity',
      value: `${formatNumber(lightningStats.torCapacity, 2)} BTC`,
      subValue: `${lightningStats.torCapacityPercentage.toFixed(1)}% of total`,
      icon: '🧅',
      color: '#000000'
    }
  ];

  return (
    <div style={{
      background: 'rgba(30, 30, 40, 0.6)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '2rem'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#000000',
          margin: 0
        }}>
          ⚡ Lightning Network Statistics
        </h3>
        <span style={{
          fontSize: '0.75rem',
          color: '#000000',
          fontStyle: 'italic'
        }}>
          Real-time data
        </span>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        {stats.map((stat, index) => (
          <div
            key={index}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${stat.color}33`,
              borderRadius: '8px',
              padding: '1rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = `${stat.color}66`;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = `${stat.color}33`;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>
                {stat.icon}
              </span>
              <span style={{
                fontSize: '0.75rem',
                color: '#aaa',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {stat.label}
              </span>
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: stat.color,
              marginBottom: '0.25rem'
            }}>
              {stat.value}
            </div>
            {stat.subValue && (
              <div style={{
                fontSize: '0.85rem',
                color: '#888'
              }}>
                {stat.subValue}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Additional Info */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: 'rgba(0, 179, 255, 0.1)',
        border: '1px solid rgba(0, 179, 255, 0.2)',
        borderRadius: '8px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          fontSize: '0.85rem'
        }}>
          <div>
            <div style={{ color: '#888', marginBottom: '0.25rem' }}>Avg Node Capacity</div>
            <div style={{ color: '#fff', fontWeight: '600' }}>
              {formatNumber(lightningStats.avgCapacity, 4)} BTC
            </div>
          </div>
          <div>
            <div style={{ color: '#888', marginBottom: '0.25rem' }}>Median Capacity</div>
            <div style={{ color: '#fff', fontWeight: '600' }}>
              {formatNumber(lightningStats.medianCapacity, 4)} BTC
            </div>
          </div>
          <div>
            <div style={{ color: '#888', marginBottom: '0.25rem' }}>Clearnet Nodes</div>
            <div style={{ color: '#fff', fontWeight: '600' }}>
              {lightningStats.clearnetNodes.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ color: '#888', marginBottom: '0.25rem' }}>Unannounced Nodes</div>
            <div style={{ color: '#fff', fontWeight: '600' }}>
              {lightningStats.unannouncedNodes.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LightningNetwork;
