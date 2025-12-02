import React from 'react';
import styles from './CompanyDetailModal.module.css';

/**
 * Company Detail Modal Component
 * Displays detailed information about a company's Bitcoin holdings
 */
function CompanyDetailModal({ company, btcPrice, onClose }) {
  if (!company) return null;

  const formatNumber = (num, decimals = 2) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(decimals)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(decimals)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate additional metrics
  const avgCostBasis = company.usd_value / company.btc_holdings;
  const currentValue = company.btc_holdings * (btcPrice || 67000);
  const unrealizedPL = currentValue - company.usd_value;
  const unrealizedPLPercent = (unrealizedPL / company.usd_value) * 100;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{company.company_name}</h2>
            <div className={styles.subtitle}>
              <span>{company.country}</span>
              <span>•</span>
              <span>Updated: {formatDate(company.last_updated)}</span>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Holdings Overview */}
        <div className={styles.gridTwo}>
          <div className={styles.cardDark}>
            <div className={styles.label}>Bitcoin Holdings</div>
            <div className={styles.largeValue}>{company.btc_holdings.toLocaleString()} BTC</div>
            <div className={styles.subValue}>
              {company.percentage_of_supply?.toFixed(4)}% of total supply
            </div>
          </div>
          <div className={styles.cardDark}>
            <div className={styles.label}>Current Value</div>
            <div className={styles.largeValue}>${formatNumber(currentValue)}</div>
            <div className={styles.subValue}>
              At ${(btcPrice || 67000).toLocaleString()}/BTC
            </div>
          </div>
        </div>

        {/* Financial Metrics */}
        <div className={styles.statsBox}>
          <div className={styles.label}>Financial Analysis</div>
          <div className={styles.statsList}>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Average Cost Basis:</span>
              <span className={styles.statValue}>
                ${avgCostBasis.toLocaleString(undefined, {maximumFractionDigits: 0})} per BTC
              </span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Book Value:</span>
              <span className={styles.statValue}>${formatNumber(company.usd_value)}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Unrealized P/L:</span>
              <span className={unrealizedPL >= 0 ? styles.positiveValue : styles.negativeValue}>
                {unrealizedPL >= 0 ? '+' : ''}${formatNumber(Math.abs(unrealizedPL))}
              </span>
            </div>
            <div className={`${styles.statRow} ${styles.roiRow}`}>
              <span className={styles.statLabel}>Return on Investment:</span>
              <span className={unrealizedPLPercent >= 0 ? styles.positiveLarge : styles.negativeLarge}>
                {unrealizedPLPercent >= 0 ? '+' : ''}{unrealizedPLPercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Supply Impact */}
        <div className={styles.statsBox}>
          <div className={styles.label}>Supply Impact</div>
          <div className={styles.statsList}>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Circulating Supply Held:</span>
              <span className={styles.statValue}>
                {company.percentage_of_supply?.toFixed(4)}%
              </span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Total Supply Held:</span>
              <span className={styles.statValue}>
                {((company.btc_holdings / 21000000) * 100).toFixed(4)}%
              </span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Rank by Holdings:</span>
              <span className={styles.highlightValue}>#{company.id}</span>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className={styles.infoBox}>
          <div className={styles.label}>Key Information</div>
          <div className={styles.infoContent}>
            <p>
              <strong className={styles.companyHighlight}>{company.company_name}</strong> holds{' '}
              <strong className={styles.btcHighlight}>{company.btc_holdings.toLocaleString()} BTC</strong>,
              making it one of the largest corporate Bitcoin holders globally.
            </p>
            <p>
              At current prices, this position is worth approximately{' '}
              <strong className={styles.usdHighlight}>${formatNumber(currentValue)}</strong> USD.
            </p>
            <p>
              The company's holdings represent{' '}
              <strong>{company.percentage_of_supply?.toFixed(4)}%</strong> of Bitcoin's
              circulating supply.
            </p>
          </div>
        </div>

        {/* External Resources */}
        <div className={styles.footer}>
          <div className={styles.label}>Learn More</div>
          <div className={styles.linksRow}>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(company.company_name + ' bitcoin holdings')}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.link} ${styles.linkPrimary}`}
            >
              Search News
            </a>
            <a
              href="https://bitcointreasuries.net/"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.link} ${styles.linkSecondary}`}
            >
              Bitcoin Treasuries
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyDetailModal;
