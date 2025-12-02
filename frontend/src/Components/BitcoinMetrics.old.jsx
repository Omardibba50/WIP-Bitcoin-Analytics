import React, { useState, useEffect } from 'react';
import { SkeletonCard } from '../components/ui/Skeleton';
import { colors, spacing, borderRadius, shadows } from '../styles/designSystem';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function BitcoinMetrics() {
  // Keep metrics flexible: could be object (original) or array (paginated list)
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state (used only if metrics is an array)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/metrics/all`);
        if (!response.ok) throw new Error('Failed to fetch metrics');
        const data = await response.json();
        // Accept either array or object - store raw payload
        setMetrics(data.data ?? data); // prefer data.data if present
        setError(null);
      } catch (err) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 300000); // 5 min
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num, decimals = 2) => {
    if (typeof num !== 'number') return num ?? '-';
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(decimals)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(decimals)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };

  // ---------- Loading / Error ----------
  if (loading && !metrics) {
    return (
      <div style={{ marginBottom: spacing.xl }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: spacing.md
        }}>
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div style={{ padding: spacing.md, textAlign: 'center', color: colors.error }}>
        Error loading metrics: {error}
      </div>
    );
  }

  if (!metrics) return null;

  // ---------- If metrics is an array -> enable pagination + render generic metric cards ----------
  if (Array.isArray(metrics)) {
    const totalPages = Math.max(1, Math.ceil(metrics.length / itemsPerPage));
    const startIdx = (currentPage - 1) * itemsPerPage;
    const currentItems = metrics.slice(startIdx, startIdx + itemsPerPage);

    return (
      <div style={{ marginBottom: spacing.xl }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: spacing.md
        }}>
          {currentItems.map((m, i) => (
            <div key={m.id ?? `${startIdx + i}`} style={{
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
                fontWeight: '600',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                borderLeft: `3px solid ${colors.accent}`,
                paddingLeft: spacing.sm
              }}>
                {m.title ?? m.name ?? 'Metric'}
              </div>
              <div style={{ fontSize: '0.7rem', color: colors.textMuted, marginBottom: '0.3rem' }}>
                {m.description ?? ''}
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: colors.textPrimary }}>
                {typeof m.value === 'number' ? formatNumber(m.value) : (m.value ?? '-')}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: spacing.sm,
          marginTop: spacing.md
        }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor: currentPage === 1 ? colors.textMuted : colors.accent,
              color: colors.textPrimary,
              border: 'none',
              borderRadius: borderRadius.md,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            Prev
          </button>

          <span style={{ color: colors.textPrimary, fontWeight: 'bold' }}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor: currentPage === totalPages ? colors.textMuted : colors.accent,
              color: colors.textPrimary,
              border: 'none',
              borderRadius: borderRadius.md,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  // ---------- Otherwise metrics is an object (original layout) ----------
  // Defensive destructure
  const supply = metrics.supply ?? {};
  const gold = metrics.gold ?? {};
  const treasury = metrics.treasury ?? {};

  // Reusable Metric Card Component
  const MetricCard = ({ title, label, value, accentColor = colors.accent }) => (
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
        borderLeft: `3px solid ${accentColor}`,
        paddingLeft: spacing.sm
      }}>
        {title}
      </div>
      <div style={{ fontSize: '0.7rem', color: colors.textMuted, marginBottom: '0.3rem' }}>
        {label}
      </div>
      <div style={{
        fontSize: '1.8rem',
        fontWeight: 'bold',
        color: colors.textPrimary
      }}>
        {value}
      </div>
    </div>
  );

  return (
    <div style={{ marginBottom: spacing.xl }}>
      {/* Section Headers with Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: spacing.md
      }}>
        {/* Gold Section */}
        <MetricCard
          title="Gold Metrics"
          label="Bitcoin priced in Gold"
          value={`${typeof gold?.btcInGold === 'number' ? gold.btcInGold.toFixed(1) : (gold?.btcInGold ?? '-')} oz`}
          accentColor="#FFD700"
        />
        
        <MetricCard
          title="Gold Metrics"
          label="Bitcoin vs Gold Market Cap"
          value={`${typeof gold?.btcVsGoldMarketCapPct === 'number' ? gold.btcVsGoldMarketCapPct.toFixed(2) : (gold?.btcVsGoldMarketCapPct ?? '-')}%`}
          accentColor="#FFD700"
        />
        
        <MetricCard
          title="Gold Metrics"
          label="Gold Price per Oz"
          value={`$${typeof gold?.goldPricePerOz === 'number' ? gold.goldPricePerOz.toLocaleString() : (gold?.goldPricePerOz ?? '-')}`}
          accentColor="#FFD700"
        />

        {/* Corporate Treasuries Section */}
        <MetricCard
          title="Corporate Treasuries"
          label="Held in Corp. Treasuries"
          value={`${treasury?.totalBtcHeld?.toLocaleString?.() ?? (treasury?.totalBtcHeld ?? '-')} BTC`}
          accentColor={colors.info}
        />
        
        <MetricCard
          title="Corporate Treasuries"
          label="Value in Corp. Treasuries"
          value={`$${formatNumber(treasury?.valueUSD ?? 0)}`}
          accentColor={colors.info}
        />
        
        <MetricCard
          title="Corporate Treasuries"
          label="Supply Pct. in Corp. Treasuries"
          value={`${typeof treasury?.supplyPct === 'number' ? treasury.supplyPct.toFixed(2) : (treasury?.supplyPct ?? '-')}%`}
          accentColor={colors.info}
        />

        {/* Supply Section */}
        <MetricCard
          title="Supply Metrics"
          label="Money Supply"
          value={`${typeof supply?.moneySupply === 'number' ? supply.moneySupply.toLocaleString(undefined, { maximumFractionDigits: 2 }) : (supply?.moneySupply ?? '-')} BTC`}
          accentColor={colors.success}
        />
        
        <MetricCard
          title="Supply Metrics"
          label="Percentage Issued"
          value={`${typeof supply?.percentageIssued === 'number' ? supply.percentageIssued.toFixed(2) : (supply?.percentageIssued ?? '-')}%`}
          accentColor={colors.success}
        />
        
        <MetricCard
          title="Supply Metrics"
          label="Unspendable"
          value={`${typeof supply?.unspendable === 'number' ? supply.unspendable.toFixed(2) : (supply?.unspendable ?? '-')} BTC`}
          accentColor={colors.success}
        />
        
        <MetricCard
          title="Supply Metrics"
          label="Issuance Remaining"
          value={`${typeof supply?.issuanceRemaining === 'number' ? supply.issuanceRemaining.toLocaleString(undefined, { maximumFractionDigits: 2 }) : (supply?.issuanceRemaining ?? '-')} BTC`}
          accentColor={colors.success}
        />
      </div>
    </div>
  );
}

export default BitcoinMetrics;
