import React, { useState, useEffect } from 'react';
import { SkeletonCard } from './LoadingSpinner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function MiningEconomics() {
  const [miningData, setMiningData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMiningEconomics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/mining/economics`);
        if (!response.ok) throw new Error('Failed to fetch mining economics');
        const data = await response.json();
        setMiningData(data.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMiningEconomics();
    const interval = setInterval(fetchMiningEconomics, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num, decimals = 2) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(decimals)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(decimals)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };

  const formatHashrate = (hashrate) => {
    // Convert TH/s to appropriate unit
    if (hashrate >= 1000000) return `${(hashrate / 1000000).toFixed(2)} EH/s`;
    if (hashrate >= 1000) return `${(hashrate / 1000).toFixed(2)} PH/s`;
    return `${hashrate.toFixed(2)} TH/s`;
  };

  if (loading && !miningData) {
    return (
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1rem'
        }}>
          {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error && !miningData) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#ff6b6b' }}>
        Error loading mining economics: {error}
      </div>
    );
  }

  if (!miningData) return null;

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Mining Economics Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem'
      }}>
        {/* Block Subsidy */}
        <div style={{
          backgroundColor: '#ffffffff',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#0a0909ff',backgroundColor: '#ffffffff', 
            marginBottom: '0.5rem',
            fontWeight: '700',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderLeft: '3px solid #000000',
            paddingLeft: '0.5rem'
          }}>
            Mining Economics
          </div>
          <div style={{ fontSize: '0.7rem',backgroundColor: '#ffffffff', color: '#000', marginBottom: '0.3rem' }}>
            Block Subsidy
          </div>
          <div style={{ 
            fontSize: '1.8rem', 
            fontWeight: 'bold',backgroundColor: '#ffffffff',
            color: '#000000'
          }}>
            {miningData.blockSubsidy.toFixed(3)} BTC
          </div>
          <div style={{ fontSize: '0.75rem', color: '#000000', marginTop: '0.5rem' }}>
            ${miningData.blockSubsidyValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* Average Fees per Block */}
        <div style={{
          backgroundColor: '#ffffffff',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #000000'
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#ffff', 
            marginBottom: '0.5rem',
            fontWeight: '700',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderLeft: '3px solid #000000',
            paddingLeft: '0.5rem'
          }}>
            Mining Economics
          </div>
          <div style={{ fontSize: '0.7rem', color: '#000', marginBottom: '0.3rem' }}>
            Avg. Fees per Block
          </div>
          <div style={{ 
            fontSize: '1.8rem', 
            fontWeight: 'bold',
            color: '#000000'
          }}>
            {miningData.avgFeesPerBlock > 0 ? miningData.avgFeesPerBlock.toFixed(4) : '0.0000'} BTC
          </div>
          <div style={{ fontSize: '0.75rem', color: '#000000', marginTop: '0.5rem' }}>
            {miningData.avgFeesVsReward}% of block reward
          </div>
        </div>

        {/* Daily PHash/s Revenue */}
        <div style={{
          backgroundColor: '#ffffffff',color: '#000000',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#ffffffff', 
            marginBottom: '0.5rem',
            fontWeight: '700',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderLeft: '3px solid #000000',
            paddingLeft: '0.5rem'
          }}>
            Mining Economics
          </div>
          <div style={{ fontSize: '0.7rem', backgroundColor: '#ffffffff', color: '#000', marginBottom: '0.3rem' }}>
            Daily PHash/s Revenue
          </div>
          <div style={{ 
            fontSize: '1.8rem', 
            fontWeight: 'bold',
            color: '#000000'
          }}>
            {miningData.dailyPHashRevenueSats.toLocaleString()} sats
          </div>
          <div style={{ fontSize: '0.75rem', color: '#000000', marginTop: '0.5rem' }}>
            ${miningData.dailyPHashRevenueUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Network Hashrate */}
        <div style={{
          backgroundColor: '#ffffff',color: '#000000',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#000000',  backgroundColor: '#ffffffff',
            marginBottom: '0.5rem',
            fontWeight: '700',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderLeft: '3px solid #000000',
            paddingLeft: '0.5rem'
          }}>
            Mining Economics
          </div>
          <div style={{ fontSize: '0.7rem', color: '#000', marginBottom: '0.3rem' }}>
            Network Hashrate
          </div>
          <div style={{ 
            fontSize: '1.8rem', 
            fontWeight: 'bold',
            color: '#000000'
          }}>
            {miningData.networkHashrateEH ? miningData.networkHashrateEH.toFixed(2) : '0.00'} EH/s
          </div>
          <div style={{ fontSize: '0.75rem', color: '#000000', marginTop: '0.5rem' }}>
            {miningData.networkHashratePH ? formatNumber(miningData.networkHashratePH, 2) : '0'} PH/s
          </div>
        </div>

        {/* Network Difficulty */}
        <div style={{
          backgroundColor: '#ffffffff',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#000000', 
            marginBottom: '0.5rem',
            fontWeight: '700',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderLeft: '3px solid #000000',
            paddingLeft: '0.5rem'
          }}>
            Mining Economics
          </div>
          <div style={{ fontSize: '0.7rem', color: '#000', marginBottom: '0.3rem' }}>
            Network Difficulty
          </div>
          <div style={{ 
            fontSize: '1.8rem', 
            fontWeight: 'bold',
            color: '#000000'
          }}>
            {miningData.difficulty > 0 ? formatNumber(miningData.difficulty, 2) + 'T' : 'Loading...'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#000000', marginTop: '0.5rem' }}>
            ~{miningData.blocksPerDay} blocks/day
          </div>
        </div>
      </div>
    </div>
  );
}

export default MiningEconomics;
