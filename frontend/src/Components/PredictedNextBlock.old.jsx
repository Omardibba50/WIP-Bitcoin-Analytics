import React, { useState, useEffect, useCallback } from 'react';
import { SkeletonCard } from '../components/ui/Skeleton';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function PredictedNextBlock() {
  const [mempoolData, setMempoolData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(600);
  const [lastUpdated, setLastUpdated] = useState(0);

  const safeToFixed = (val, digits = 2) =>
    val != null && !isNaN(val) ? val.toFixed(digits) : 'N/A';

  const formatNumber = (num, decimals = 0) => {
    if (num == null || isNaN(num)) return 'N/A';
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toFixed(decimals);
  };

  const formatTime = (seconds) => {
    if (seconds <= 0) return 'Any moment...';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs.toString().padStart(2, '0')}s` : `${secs}s`;
  };

  useEffect(() => {
    if (!mempoolData?.nextBlock?.estimatedTime) return;
    let animationFrameId;
    let lastUpdateTime = Date.now();
    let remaining = mempoolData.nextBlock.estimatedTime;

    const updateCountdown = () => {
      const now = Date.now();
      const delta = (now - lastUpdateTime) / 1000;
      lastUpdateTime = now;
      remaining = Math.max(0, remaining - delta);
      setTimeRemaining(Math.ceil(remaining));
      if (remaining > 0) animationFrameId = requestAnimationFrame(updateCountdown);
    };

    setTimeRemaining(Math.ceil(remaining));
    animationFrameId = requestAnimationFrame(updateCountdown);
    return () => cancelAnimationFrame(animationFrameId);
  }, [mempoolData?.nextBlock?.estimatedTime]);

  const fetchMempoolData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/mempool/stats`);
      if (!response.ok) throw new Error('Failed to fetch mempool data');
      const data = await response.json();

      if (data.data?.nextBlock?.estimatedTime) {
        setMempoolData(prev => {
          if (
            prev?.nextBlock?.estimatedTime &&
            Math.abs(prev.nextBlock.estimatedTime - data.data.nextBlock.estimatedTime) < 5
          ) {
            return prev;
          }
          return data.data;
        });
        setLastUpdated(Date.now());
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching mempool data:', err);
      setError(err.message);
      setTimeout(fetchMempoolData, 5000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMempoolData();
    const interval = setInterval(fetchMempoolData, 15000);
    return () => clearInterval(interval);
  }, [fetchMempoolData]);

  if (loading && !mempoolData) return <SkeletonCard />;
  
  if (error && !mempoolData) {
    return (
      <div style={{
        padding: '1.5rem',
        background: 'rgba(26, 26, 26, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
      }}>
        <h3 style={{ color: '#ef4444', marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: '600' }}>
          Error Loading Data
        </h3>
        <p style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>{error}</p>
      </div>
    );
  }

  if (!mempoolData) return <SkeletonCard />;

  const { transactionCount, totalFees, totalFeesUSD, nextBlock } = mempoolData;

  return (
    <div style={{
      padding: '2rem',
      background: 'rgba(26, 26, 26, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      marginBottom: '1.5rem',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
      transition: 'all 0.25s ease'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#ffffff',
          margin: 0,
          letterSpacing: '-0.25px'
        }}>
          Next Block Prediction
        </h3>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'rgba(0, 179, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          border: '1px solid rgba(0, 179, 255, 0.3)'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#00b3ff',
            boxShadow: '0 0 8px rgba(0, 179, 255, 0.6)'
          }} />
          <span style={{ fontSize: '0.85rem', color: '#00b3ff', fontWeight: '600' }}>LIVE</span>
        </div>
      </div>

      {/* Mempool Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1.25rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          transition: 'all 0.25s ease'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.5rem', fontWeight: '500' }}>
            Pending Transactions
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ffffff' }}>
            {formatNumber(transactionCount)}
          </div>
        </div>

        <div style={{
          padding: '1.25rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          transition: 'all 0.25s ease'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.5rem', fontWeight: '500' }}>
            Total Fees (BTC)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ffffff' }}>
            {safeToFixed(totalFees, 4)}
          </div>
        </div>

        <div style={{
          padding: '1.25rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          transition: 'all 0.25s ease'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.5rem', fontWeight: '500' }}>
            Total Fees (USD)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#00b3ff' }}>
            ${formatNumber(totalFeesUSD, 2)}
          </div>
        </div>
      </div>

      {/* Next Block Prediction */}
      <div style={{
        padding: '1.5rem',
        background: 'rgba(0, 179, 255, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(0, 179, 255, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '500', color: '#a0a0a0', margin: '0 0 0.5rem 0' }}>
              Estimated Time
            </h4>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#ffffff',
              lineHeight: 1,
              letterSpacing: '-0.5px'
            }}>
              {formatTime(timeRemaining)}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.5rem', fontWeight: '500' }}>
              Transactions
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ffffff' }}>
              {formatNumber(nextBlock?.transactionCount || 0)}
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.4rem', fontWeight: '500' }}>
              Block Fees (BTC)
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff' }}>
              {safeToFixed(nextBlock?.totalFees || 0, 6)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.4rem', fontWeight: '500' }}>
              Block Fees (USD)
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#00b3ff' }}>
              ${formatNumber(nextBlock?.totalFeesUSD || 0, 2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PredictedNextBlock;
