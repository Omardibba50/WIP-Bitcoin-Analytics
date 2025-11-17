import React, { useState, useEffect, useCallback } from 'react';
import { SkeletonCard } from './LoadingSpinner';

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

  const getCurrentTimeRemaining = () => {
    if (!mempoolData?.nextBlock?.estimatedTime) return 600;
    if (timeRemaining > 0) return timeRemaining;
    const elapsed = (Date.now() - lastUpdated) / 1000;
    return Math.max(0, (mempoolData.nextBlock.estimatedTime || 600) - Math.floor(elapsed));
  };

  if (loading && !mempoolData) {
    return (
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#ffffffff', marginBottom: '1rem' }}>
          Predicted Next Block
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}
        >
          {[1, 2, 3, 4, 5, 6].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error && !mempoolData) {
    return <div style={{ color: '#ff6b6b', padding: '1rem' }}>Error loading mempool data: {error}</div>;
  }

  if (!mempoolData || !mempoolData.nextBlock) return null;

  const { nextBlock } = mempoolData;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', color: '#ffffffff', marginBottom: '1rem', fontWeight: 600 }}>
        Predicted Next Block
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}
      >
        <Card
          title="Predicted Next Block"
          label="Transaction Count"
          value={formatNumber(nextBlock.transactionCount || 0)}
          unit="txs"
        />

        <Card
          title="Predicted Next Block"
          label="Total Fees"
          value={`${safeToFixed(nextBlock.totalFees, 4)} BTC`}
          sub={`$${nextBlock.totalFeesUSD ? nextBlock.totalFeesUSD.toLocaleString() : '0'}`}
        />

        <Card
          title="Predicted Size"
          label="Size"
          value={`${safeToFixed((nextBlock.totalSize || 1400000) / 1000000, 2)} MB`}
          sub={`Capacity: ${Math.min(
            100,
            Math.round(((nextBlock.totalSize || 1400000) / 2000000) * 100)
          )}%`}
        />

        <Card
          title="Predicted Next Block"
          label="Median Fee Rate"
          value={`${safeToFixed(nextBlock.medianFeeRate, 1)} sat/vB`}
        />

        <Card
          title="Predicted Next Block"
          label="Fee Range"
          value={`${safeToFixed(nextBlock.minFeeRate, 1)} - ${safeToFixed(nextBlock.maxFeeRate, 1)} sat/vB`}
        />

        <Card
          title="Next Block In"
          label="Time"
          value={formatTime(getCurrentTimeRemaining())}
          sub={`Last block: ${new Date(mempoolData.lastUpdated).toLocaleTimeString()}`}
        />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', color: '#ffffffff', marginBottom: '1rem' }}>
          Current Mempool
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}
        >
          <Card label="Pending Transactions" value={formatNumber(mempoolData.transactionCount || 0)} />
          <Card label="Total Fees" value={`${safeToFixed(mempoolData.totalFees, 2)} BTC`} />
          <Card label="Fast Fee (30 min)" value={`${mempoolData.halfHourFee || 'N/A'} sat/vB`} />
          <Card label="Economy Fee (1 hour)" value={`${mempoolData.hourFee || 'N/A'} sat/vB`} />
        </div>
      </div>
    </div>
  );
}

const Card = ({ title, label, value, sub, unit }) => (
  <div
    style={{
      backgroundColor: '#ffffff',
      padding: '1.2rem',
      borderRadius: '8px',
      border: '1px solid #fff',
      color: '#020202ff'
    }}
  >
    {title && (
      <div
        style={{
          fontSize: '0.75rem',
          color: '#000000',
          textTransform: 'uppercase',
          fontWeight: '700',
          marginBottom: '0.5rem',
          borderLeft: '3px solid #000000',
          paddingLeft: '0.5rem'
        }}
      >
        {title}
      </div>
    )}
    {label && <div style={{ fontSize: '0.7rem', color: '#000', marginBottom: '0.3rem' }}>{label}</div>}
    <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#000000' }}>
      {value} {unit && <span style={{ fontSize: '1rem', color: '#000' }}>{unit}</span>}
    </div>
    {sub && <div style={{ fontSize: '0.75rem', color: '#000', marginTop: '0.5rem' }}>{sub}</div>}
  </div>
);

export default PredictedNextBlock;
