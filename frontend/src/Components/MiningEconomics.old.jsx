import React, { useState, useEffect } from 'react';
import { SkeletonCard } from '../components/ui/Skeleton';
import { colors, spacing, borderRadius, shadows } from '../styles/designSystem';

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
      <div style={{ marginBottom: spacing.xl }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: spacing.md
        }}>
          {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error && !miningData) {
    return (
      <div style={{ padding: spacing.md, textAlign: 'center', color: colors.error }}>
        Error loading mining economics: {error}
      </div>
    );
  }

  if (!miningData) return null;

  return (
    <div style={{ marginBottom: spacing.xl }}>
      {/* Mining Economics Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: spacing.md
      }}>
        {/* Block Subsidy */}
        <div style={{
          background: colors.cardBg,
          backdropFilter: 'blur(10px)',
          padding: spacing.xl,
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: shadows.md
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: colors.textSecondary,
            marginBottom: spacing.sm,
            fontWeight: '700',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderLeft: `3px solid ${colors.accent}`,
            paddingLeft: spacing.sm
          }}>
            Mining Economics
          </div>
          <div style={{ fontSize: '0.7rem', color: colors.textMuted, marginBottom: '0.3rem' }}>
            Block Subsidy
          </div>
          <div style={{ 
            fontSize: '1.8rem', 
            fontWeight: 'bold',
            color: colors.textPrimary
          }}>
            {miningData.blockSubsidy.toFixed(3)} BTC
          </div>
          <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginTop: spacing.sm }}>
            ${miningData.blockSubsidyValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* Average Fees per Block */}
        <div style={{
          background: colors.cardBg,
          backdropFilter: 'blur(10px)',
          padding: spacing.xl,
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: shadows.md
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: colors.textSecondary, 
            marginBottom: spacing.sm,
            fontWeight: '700',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderLeft: `3px solid ${colors.accent}`,
            paddingLeft: spacing.sm
          }}>
            Mining Economics
          </div>
          <div style={{ fontSize: '0.7rem', color: colors.textMuted, marginBottom: '0.3rem' }}>
            Avg. Fees per Block
          </div>
          <div style={{ 
            fontSize: '1.8rem', 
            fontWeight: 'bold',
            color: colors.textPrimary
          }}>
            {miningData.avgFeesPerBlock > 0 ? miningData.avgFeesPerBlock.toFixed(4) : '0.0000'} BTC
          </div>
          <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginTop: spacing.sm }}>
            {miningData.avgFeesVsReward}% of block reward
          </div>
        </div>

        {/* Daily PHash/s Revenue */}
        <div style={{
          background: colors.cardBg,
          backdropFilter: 'blur(10px)',
          padding: spacing.xl,
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: shadows.md
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: colors.textSecondary, 
            marginBottom: spacing.sm,
            fontWeight: '700',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderLeft: `3px solid ${colors.accent}`,
            paddingLeft: spacing.sm
          }}>
            Mining Economics
          </div>
          <div style={{ fontSize: '0.7rem', color: colors.textMuted, marginBottom: '0.3rem' }}>
            Daily PHash/s Revenue
          </div>
          <div style={{ 
            fontSize: '1.8rem', 
            fontWeight: 'bold',
            color: colors.textPrimary
          }}>
            {miningData.dailyPHashRevenueSats.toLocaleString()} sats
          </div>
          <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginTop: spacing.sm }}>
            ${miningData.dailyPHashRevenueUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Network Hashrate */}
        <div style={{
          background: colors.cardBg,
          backdropFilter: 'blur(10px)',
          padding: spacing.xl,
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: shadows.md
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: colors.textSecondary,
            marginBottom: spacing.sm,
            fontWeight: '700',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderLeft: `3px solid ${colors.accent}`,
            paddingLeft: spacing.sm
          }}>
            Mining Economics
          </div>
          <div style={{ fontSize: '0.7rem', color: colors.textMuted, marginBottom: '0.3rem' }}>
            Network Hashrate
          </div>
          <div style={{ 
            fontSize: '1.8rem', 
            fontWeight: 'bold',
            color: colors.textPrimary
          }}>
            {miningData.networkHashrateEH ? miningData.networkHashrateEH.toFixed(2) : '0.00'} EH/s
          </div>
          <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginTop: spacing.sm }}>
            {miningData.networkHashratePH ? formatNumber(miningData.networkHashratePH, 2) : '0'} PH/s
          </div>
        </div>

        {/* Network Difficulty */}
        <div style={{
          background: colors.cardBg,
          backdropFilter: 'blur(10px)',
          padding: spacing.xl,
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: shadows.md
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: colors.textSecondary, 
            marginBottom: spacing.sm,
            fontWeight: '700',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderLeft: `3px solid ${colors.accent}`,
            paddingLeft: spacing.sm
          }}>
            Mining Economics
          </div>
          <div style={{ fontSize: '0.7rem', color: colors.textMuted, marginBottom: '0.3rem' }}>
            Network Difficulty
          </div>
          <div style={{ 
            fontSize: '1.8rem', 
            fontWeight: 'bold',
            color: colors.textPrimary
          }}>
            {miningData.difficulty > 0 ? formatNumber(miningData.difficulty, 2) + 'T' : 'Loading...'}
          </div>
          <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginTop: spacing.sm }}>
            ~{miningData.blocksPerDay} blocks/day
          </div>
        </div>
      </div>
    </div>
  );
}

export default MiningEconomics;
