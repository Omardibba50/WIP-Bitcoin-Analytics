import React, { useState, useEffect } from 'react';
import { SkeletonCard } from './LoadingSpinner';

const API_BASE_URL = 'http://localhost:5000/api';

function BitcoinMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/metrics/all`);
        if (!response.ok) throw new Error('Failed to fetch metrics');
        const data = await response.json();
        setMetrics(data.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num, decimals = 2) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(decimals)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(decimals)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };

  if (loading && !metrics) {
    return (
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1rem'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#ff6b6b' }}>
        Error loading metrics: {error}
      </div>
    );
  }

  if (!metrics) return null;

  const { supply, gold, treasury } = metrics;

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Section Headers with Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem'
      }}>
        {/* Gold Section */}
        <div style={{
          gridColumn: 'span 3',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem'
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #333',
            position: 'relative'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#fbbf24', 
              marginBottom: '0.5rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderLeft: '3px solid #fbbf24',
              paddingLeft: '0.5rem'
            }}>
              Gold Metrics
            </div>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.3rem' }}>
              Bitcoin priced in Gold
            </div>
            <div style={{ 
              fontSize: '1.8rem', 
              fontWeight: 'bold',
              color: '#fbbf24'
            }}>
              {gold?.btcInGold.toFixed(1)} oz
            </div>
          </div>

          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #333'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#fbbf24', 
              marginBottom: '0.5rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderLeft: '3px solid #fbbf24',
              paddingLeft: '0.5rem'
            }}>
              Gold Metrics
            </div>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.3rem' }}>
              Bitcoin vs Gold Market Cap
            </div>
            <div style={{ 
              fontSize: '1.8rem', 
              fontWeight: 'bold',
              color: '#fbbf24'
            }}>
              {gold?.btcVsGoldMarketCapPct.toFixed(2)}%
            </div>
          </div>

          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #333'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#fbbf24', 
              marginBottom: '0.5rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderLeft: '3px solid #fbbf24',
              paddingLeft: '0.5rem'
            }}>
              Gold Metrics
            </div>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.3rem' }}>
              Gold Price per Oz
            </div>
            <div style={{ 
              fontSize: '1.8rem', 
              fontWeight: 'bold',
              color: '#fbbf24'
            }}>
              ${gold?.goldPricePerOz.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Corporate Treasuries Section */}
        <div style={{
          gridColumn: 'span 3',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem'
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #333'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#00b3ff', 
              marginBottom: '0.5rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderLeft: '3px solid #00b3ff',
              paddingLeft: '0.5rem'
            }}>
              Corporate Treasuries
            </div>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.3rem' }}>
              Held in Corp. Treasuries
            </div>
            <div style={{ 
              fontSize: '1.8rem', 
              fontWeight: 'bold',
              color: '#00b3ff'
            }}>
              {treasury?.totalBtcHeld.toLocaleString()} BTC
            </div>
          </div>

          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #333'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#00b3ff', 
              marginBottom: '0.5rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderLeft: '3px solid #00b3ff',
              paddingLeft: '0.5rem'
            }}>
              Corporate Treasuries
            </div>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.3rem' }}>
              Value in Corp. Treasuries
            </div>
            <div style={{ 
              fontSize: '1.8rem', 
              fontWeight: 'bold',
              color: '#00b3ff'
            }}>
              ${formatNumber(treasury?.valueUSD)}
            </div>
          </div>

          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #333'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#00b3ff', 
              marginBottom: '0.5rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderLeft: '3px solid #00b3ff',
              paddingLeft: '0.5rem'
            }}>
              Corporate Treasuries
            </div>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.3rem' }}>
              Supply Pct. in Corp. Treasuries
            </div>
            <div style={{ 
              fontSize: '1.8rem', 
              fontWeight: 'bold',
              color: '#00b3ff'
            }}>
              {treasury?.supplyPct.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Supply Section */}
        <div style={{
          gridColumn: 'span 4',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem'
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #333'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#4ade80', 
              marginBottom: '0.5rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderLeft: '3px solid #4ade80',
              paddingLeft: '0.5rem'
            }}>
              Supply Metrics
            </div>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.3rem' }}>
              Money Supply
            </div>
            <div style={{ 
              fontSize: '1.8rem', 
              fontWeight: 'bold',
              color: '#4ade80'
            }}>
              {supply?.moneySupply.toLocaleString(undefined, {maximumFractionDigits: 2})} BTC
            </div>
          </div>

          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #333'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#4ade80', 
              marginBottom: '0.5rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderLeft: '3px solid #4ade80',
              paddingLeft: '0.5rem'
            }}>
              Supply Metrics
            </div>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.3rem' }}>
              Percentage Issued
            </div>
            <div style={{ 
              fontSize: '1.8rem', 
              fontWeight: 'bold',
              color: '#4ade80'
            }}>
              {supply?.percentageIssued.toFixed(2)}%
            </div>
          </div>

          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #333'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#4ade80', 
              marginBottom: '0.5rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderLeft: '3px solid #4ade80',
              paddingLeft: '0.5rem'
            }}>
              Supply Metrics
            </div>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.3rem' }}>
              Unspendable
            </div>
            <div style={{ 
              fontSize: '1.8rem', 
              fontWeight: 'bold',
              color: '#ff6b6b'
            }}>
              {supply?.unspendable.toFixed(2)} BTC
            </div>
          </div>

          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #333'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#4ade80', 
              marginBottom: '0.5rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderLeft: '3px solid #4ade80',
              paddingLeft: '0.5rem'
            }}>
              Supply Metrics
            </div>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.3rem' }}>
              Issuance Remaining
            </div>
            <div style={{ 
              fontSize: '1.8rem', 
              fontWeight: 'bold',
              color: '#4ade80'
            }}>
              {supply?.issuanceRemaining.toLocaleString(undefined, {maximumFractionDigits: 2})} BTC
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BitcoinMetrics;
