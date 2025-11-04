import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SkeletonCard } from './LoadingSpinner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function PredictedNextBlock() {
  const [mempoolData, setMempoolData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(600); // Default to 10 minutes
  const [lastUpdated, setLastUpdated] = useState(0);

  // Countdown timer using requestAnimationFrame for smooth updates
  useEffect(() => {
    if (!mempoolData?.nextBlock?.estimatedTime) return;
    
    let animationFrameId;
    let lastUpdateTime = Date.now();
    let remaining = mempoolData.nextBlock.estimatedTime;
    
    const updateCountdown = () => {
      const now = Date.now();
      const delta = (now - lastUpdateTime) / 1000; // in seconds
      lastUpdateTime = now;
      
      // Update remaining time
      remaining = Math.max(0, remaining - delta);
      setTimeRemaining(Math.ceil(remaining));
      
      // Only continue if there's time left
      if (remaining > 0) {
        animationFrameId = requestAnimationFrame(updateCountdown);
      }
    };
    
    // Start the countdown
    setTimeRemaining(Math.ceil(remaining));
    animationFrameId = requestAnimationFrame(updateCountdown);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [mempoolData?.nextBlock?.estimatedTime]);

  // Fetch mempool data with retry logic
  const fetchMempoolData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/mempool/stats`);
      if (!response.ok) throw new Error('Failed to fetch mempool data');
      const data = await response.json();
      
      // Only update if we have new data
      if (data.data?.nextBlock?.estimatedTime) {
        setMempoolData(prev => {
          // Only update if the estimated time has changed significantly (> 5 seconds)
          if (prev?.nextBlock?.estimatedTime && 
              Math.abs(prev.nextBlock.estimatedTime - data.data.nextBlock.estimatedTime) < 5) {
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
      
      // Retry sooner if there's an error
      setTimeout(fetchMempoolData, 5000);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up data refresh interval
  useEffect(() => {
    // Initial fetch
    fetchMempoolData();
    
    // Refresh every 15 seconds (reduced from 30s for more frequent updates)
    const interval = setInterval(fetchMempoolData, 15000);
    return () => clearInterval(interval);
  }, [fetchMempoolData]);

  const formatNumber = (num, decimals = 0) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(decimals);
  };

  const formatTime = (seconds) => {
    if (seconds <= 0) return 'Any moment...';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    if (mins > 0) {
      return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${secs}s`;
  };

  // Get the current time remaining with sub-second precision
  const getCurrentTimeRemaining = () => {
    if (!mempoolData?.nextBlock?.estimatedTime) return 600;
    
    // If we have an active countdown, use that
    if (timeRemaining > 0) {
      return timeRemaining;
    }
    
    // Fallback: calculate remaining time since last update
    const elapsed = (Date.now() - lastUpdated) / 1000;
    return Math.max(0, (mempoolData.nextBlock.estimatedTime || 600) - Math.floor(elapsed));
  };

  if (loading && !mempoolData) {
    return (
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          marginBottom: '1rem',
          color: '#fff',
          fontWeight: '600'
        }}>
          Predicted Next Block
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1rem'
        }}>
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error && !mempoolData) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#ff6b6b' }}>
        Error loading mempool data: {error}
      </div>
    );
  }

  if (!mempoolData || !mempoolData.nextBlock) return null;

  const { nextBlock } = mempoolData;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ 
        fontSize: '1.5rem', 
        marginBottom: '1rem',
        color: '#fff',
        fontWeight: '600'
      }}>
        Predicted Next Block
      </h2>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem'
      }}>
        {/* Transaction Count */}
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#10b981', 
            marginBottom: '0.5rem',
            fontWeight: '700',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderLeft: '3px solid #10b981',
            paddingLeft: '0.5rem'
          }}>
            Predicted Next Block
          </div>
          <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.3rem' }}>
            Transaction Count
          </div>
          <div style={{ 
            fontSize: '1.8rem', 
            fontWeight: 'bold',
            color: '#10b981'
          }}>
            {nextBlock.transactionCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.5rem' }}>
            txs in next block
          </div>
        </div>

        {/* Total Fees */}
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#10b981', 
            marginBottom: '0.5rem',
            fontWeight: '700',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderLeft: '3px solid #10b981',
            paddingLeft: '0.5rem'
          }}>
            Predicted Next Block
          </div>
          <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.3rem' }}>
            Total Fees
          </div>
          <div style={{ 
            fontSize: '1.8rem', 
            fontWeight: 'bold',
            color: '#10b981'
          }}>
            {nextBlock.totalFees.toFixed(4)} BTC
          </div>
          <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.5rem' }}>
            ${nextBlock.totalFeesUSD ? nextBlock.totalFeesUSD.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
          </div>
        </div>

        {/* Block Size */}
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Recent blocks stats */}
          <div style={{ 
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            fontSize: '0.65rem',
            color: '#888',
            textAlign: 'right',
            padding: '0.2rem 0.5rem',
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Last blocks: 1.0-1.6 MB</span>
            <span>Avg: ~1.4 MB</span>
          </div>
          
          {/* Block size utilization bar */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '4px',
            backgroundColor: '#10b981',
            width: `${Math.min(100, ((nextBlock.totalSize || 1400000) / 2000000) * 100)}%`,
            opacity: 0.3,
            transition: 'width 0.5s ease-out'
          }} />
          
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '0.5rem'
          }}>
            <div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#10b981', 
                fontWeight: '700',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '0.25rem'
              }}>
                Predicted Size
              </div>
              <div style={{ 
                fontSize: '1.8rem', 
                fontWeight: 'bold',
                color: '#10b981',
                fontFeatureSettings: 'tnum',
                lineHeight: 1
              }}>
                {((nextBlock.totalSize || 1400000) / 1000000).toFixed(2)} <span style={{ fontSize: '1rem', opacity: 0.7 }}>MB</span>
              </div>
            </div>
            
            <div style={{ 
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              padding: '0.5rem',
              borderRadius: '6px',
              textAlign: 'center',
              minWidth: '80px'
            }}>
              <div style={{ fontSize: '0.65rem', color: '#888', marginBottom: '0.25rem' }}>Est. Capacity</div>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600',
                color: '#10b981'
              }}>
                {Math.min(100, Math.round(((nextBlock.totalSize || 1400000) / 2000000) * 100))}%
              </div>
            </div>
          </div>
          
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.7rem',
            color: '#888',
            marginTop: '0.5rem'
          }}>
            <span>{formatNumber(nextBlock.transactionCount || 0)} transactions</span>
            <span>Fees: {nextBlock.minFeeRate?.toFixed(0) || '1'}-{nextBlock.maxFeeRate?.toFixed(0) || '10'} sat/vB</span>
          </div>
          <div style={{ 
            fontSize: '0.7rem', 
            color: '#888',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Fee range: {nextBlock.minFeeRate.toFixed(1)}-{nextBlock.maxFeeRate.toFixed(1)} sat/vB</span>
          </div>
        </div>

        {/* Median Fee Rate */}
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#10b981', 
            marginBottom: '0.5rem',
            fontWeight: '700',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderLeft: '3px solid #10b981',
            paddingLeft: '0.5rem'
          }}>
            Predicted Next Block
          </div>
          <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.3rem' }}>
            Median Fee Rate
          </div>
          <div style={{ 
            fontSize: '1.8rem', 
            fontWeight: 'bold',
            color: '#10b981'
          }}>
            {nextBlock.medianFeeRate.toFixed(1)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.5rem' }}>
            sat/vB
          </div>
        </div>

        {/* Fee Range */}
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#10b981', 
            marginBottom: '0.5rem',
            fontWeight: '700',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderLeft: '3px solid #10b981',
            paddingLeft: '0.5rem'
          }}>
            Predicted Next Block
          </div>
          <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.3rem' }}>
            Fee Range
          </div>
          <div style={{ 
            fontSize: '1.8rem', 
            fontWeight: 'bold',
            color: '#10b981'
          }}>
            {nextBlock.minFeeRate.toFixed(1)} - {nextBlock.maxFeeRate.toFixed(1)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.5rem' }}>
            sat/vB
          </div>
        </div>

        {/* Estimated Time */}
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Animated progress bar */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '4px',
            backgroundColor: '#10b981',
            width: `${(1 - (getCurrentTimeRemaining() / 600)) * 100}%`,
            transition: 'width 1s linear',
            opacity: 0.7
          }} />
          
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#10b981', 
            marginBottom: '0.5rem',
            fontWeight: '700',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderLeft: '3px solid #10b981',
            paddingLeft: '0.5rem'
          }}>
            Next Block In
          </div>
          <div style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold',
            color: '#10b981',
            fontFamily: 'monospace',
            letterSpacing: '0.1em'
          }}>
            {formatTime(getCurrentTimeRemaining())}
          </div>
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#888', 
            marginTop: '0.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Last block: {new Date(mempoolData.lastUpdated).toLocaleTimeString()}</span>
            <span style={{
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              padding: '0.2rem 0.4rem',
              borderRadius: '4px',
              fontSize: '0.65rem',
              fontWeight: 'bold'
            }}>
              LIVE
            </span>
          </div>
        </div>
      </div>

      {/* Current Mempool Stats */}
      <div style={{ marginTop: '1.5rem' }}>
        <h3 style={{ 
          fontSize: '1.2rem', 
          marginBottom: '1rem',
          color: '#fff',
          fontWeight: '600'
        }}>
          Current Mempool
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem'
        }}>
          {/* Pending Transactions */}
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #333'
          }}>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.3rem' }}>
              Pending Transactions
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
              {mempoolData.transactionCount.toLocaleString()}
            </div>
          </div>

          {/* Total Fees */}
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #333'
          }}>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.3rem' }}>
              Total Fees
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
              {mempoolData.totalFees.toFixed(2)} BTC
            </div>
          </div>

          {/* Recommended Fee */}
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #333'
          }}>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.3rem' }}>
              Fast Fee (30 min)
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
              {mempoolData.halfHourFee} sat/vB
            </div>
          </div>

          {/* Economy Fee */}
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #333'
          }}>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.3rem' }}>
              Economy Fee (1 hour)
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
              {mempoolData.hourFee} sat/vB
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PredictedNextBlock;
