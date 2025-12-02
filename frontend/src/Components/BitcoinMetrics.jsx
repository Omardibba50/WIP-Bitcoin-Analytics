import React, { useState } from 'react';
import { useDataFetch } from '../hooks/useDataFetch';
import { metricsApi } from '../services/apiClient';
import { Card } from '../components/ui';
import { LoadingSpinner } from '../components/ui';
import styles from './BitcoinMetrics.module.css';

function BitcoinMetrics() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { data: metrics, loading, error } = useDataFetch(
    () => metricsApi.getAll(),
    {
      pollInterval: 300000, // 5 minutes
      cacheKey: 'metrics-all'
    }
  );

  const formatNumber = (num, decimals = 2) => {
    if (typeof num !== 'number') return num ?? '-';
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(decimals)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(decimals)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };

  // Loading state
  if (loading && !metrics) {
    return (
      <div className={styles.container}>
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (error && !metrics) {
    return (
      <div className={styles.error}>
        <p>Error loading metrics: {error.message || error}</p>
      </div>
    );
  }

  if (!metrics) return null;

  // Array layout (paginated metrics)
  if (Array.isArray(metrics)) {
    const totalPages = Math.max(1, Math.ceil(metrics.length / itemsPerPage));
    const startIdx = (currentPage - 1) * itemsPerPage;
    const currentItems = metrics.slice(startIdx, startIdx + itemsPerPage);

    return (
      <div className={styles.container}>
        <div className={styles.grid}>
          {currentItems.map((metric, i) => (
            <Card key={metric.id ?? `${startIdx + i}`} className={styles.metricCard}>
              <div className={styles.metricTitle}>
                {metric.title ?? metric.name ?? 'Metric'}
              </div>
              {metric.description && (
                <div className={styles.metricDescription}>
                  {metric.description}
                </div>
              )}
              <div className={styles.metricValue}>
                {typeof metric.value === 'number' 
                  ? formatNumber(metric.value) 
                  : (metric.value ?? '-')}
              </div>
            </Card>
          ))}
        </div>

        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={styles.paginationButton}
            aria-label="Previous page"
          >
            Prev
          </button>

          <span className={styles.paginationInfo}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  // Object layout (structured metrics)
  const supply = metrics.supply ?? {};
  const gold = metrics.gold ?? {};
  const treasury = metrics.treasury ?? {};

  const MetricCard = ({ title, label, value, variant = 'default' }) => (
    <Card className={`${styles.metricCard} ${styles[variant]}`}>
      <div className={styles.metricTitle}>
        {title}
      </div>
      <div className={styles.metricLabel}>
        {label}
      </div>
      <div className={styles.metricValue}>
        {value}
      </div>
    </Card>
  );

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {/* Gold Metrics */}
        <MetricCard
          title="Gold Metrics"
          label="Bitcoin priced in Gold"
          value={`${typeof gold?.btcInGold === 'number' ? gold.btcInGold.toFixed(1) : (gold?.btcInGold ?? '-')} oz`}
          variant="gold"
        />
        
        <MetricCard
          title="Gold Metrics"
          label="Bitcoin vs Gold Market Cap"
          value={`${typeof gold?.btcVsGoldMarketCapPct === 'number' ? gold.btcVsGoldMarketCapPct.toFixed(2) : (gold?.btcVsGoldMarketCapPct ?? '-')}%`}
          variant="gold"
        />
        
        <MetricCard
          title="Gold Metrics"
          label="Gold Price per Oz"
          value={`$${typeof gold?.goldPricePerOz === 'number' ? gold.goldPricePerOz.toLocaleString() : (gold?.goldPricePerOz ?? '-')}`}
          variant="gold"
        />

        {/* Corporate Treasuries */}
        <MetricCard
          title="Corporate Treasuries"
          label="Held in Corp. Treasuries"
          value={`${treasury?.totalBtcHeld?.toLocaleString?.() ?? (treasury?.totalBtcHeld ?? '-')} BTC`}
          variant="info"
        />
        
        <MetricCard
          title="Corporate Treasuries"
          label="Value in Corp. Treasuries"
          value={`$${formatNumber(treasury?.valueUSD ?? 0)}`}
          variant="info"
        />
        
        <MetricCard
          title="Corporate Treasuries"
          label="Supply Pct. in Corp. Treasuries"
          value={`${typeof treasury?.supplyPct === 'number' ? treasury.supplyPct.toFixed(2) : (treasury?.supplyPct ?? '-')}%`}
          variant="info"
        />

        {/* Supply Metrics */}
        <MetricCard
          title="Supply Metrics"
          label="Money Supply"
          value={`${typeof supply?.moneySupply === 'number' ? supply.moneySupply.toLocaleString(undefined, { maximumFractionDigits: 2 }) : (supply?.moneySupply ?? '-')} BTC`}
          variant="success"
        />
        
        <MetricCard
          title="Supply Metrics"
          label="Percentage Issued"
          value={`${typeof supply?.percentageIssued === 'number' ? supply.percentageIssued.toFixed(2) : (supply?.percentageIssued ?? '-')}%`}
          variant="success"
        />
        
        <MetricCard
          title="Supply Metrics"
          label="Unspendable"
          value={`${typeof supply?.unspendable === 'number' ? supply.unspendable.toFixed(2) : (supply?.unspendable ?? '-')} BTC`}
          variant="success"
        />
        
        <MetricCard
          title="Supply Metrics"
          label="Issuance Remaining"
          value={`${typeof supply?.issuanceRemaining === 'number' ? supply.issuanceRemaining.toLocaleString(undefined, { maximumFractionDigits: 2 }) : (supply?.issuanceRemaining ?? '-')} BTC`}
          variant="success"
        />
      </div>
    </div>
  );
}

export default BitcoinMetrics;
