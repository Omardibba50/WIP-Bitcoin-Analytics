import React, { useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useDataFetch } from '../hooks/useDataFetch';
import { treasuryApi, priceApi } from '../services/apiClient';
import { Card, LoadingSpinner } from './ui';
import { createBarChart, createDoughnutChart } from '../utils/chartFactory';
import CompanyDetailModal from './CompanyDetailModal';
import styles from './CorporateTreasuries.module.css';

function CorporateTreasuries() {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: treasuries, loading: treasuriesLoading, error: treasuriesError } = useDataFetch(
    () => treasuryApi.getAll(),
    {
      pollInterval: 300000, // 5 minutes
      cacheKey: 'treasuries-all'
    }
  );

  const { data: stats } = useDataFetch(
    () => treasuryApi.getStats(),
    {
      pollInterval: 300000,
      cacheKey: 'treasuries-stats'
    }
  );

  const { data: priceData } = useDataFetch(
    () => priceApi.getLatest('BTC'),
    {
      pollInterval: 60000, // 1 minute
      cacheKey: 'btc-price-latest'
    }
  );

  const btcPrice = priceData?.price || 67000;

  const formatNumber = (num) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  // Loading state
  if (treasuriesLoading && (!treasuries || treasuries.length === 0)) {
    return (
      <div className={styles.container}>
        <h2 className={styles.header}>Corporate Bitcoin Treasuries</h2>
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (treasuriesError && (!treasuries || treasuries.length === 0)) {
    return (
      <div className={styles.container}>
        <h2 className={styles.header}>Corporate Bitcoin Treasuries</h2>
        <div className={styles.error}>
          <p>Error loading treasuries: {treasuriesError.message || treasuriesError}</p>
        </div>
      </div>
    );
  }

  if (!treasuries || treasuries.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.header}>Corporate Bitcoin Treasuries</h2>
        <div className={styles.error}>
          <p>No corporate treasury data available.</p>
        </div>
      </div>
    );
  }

  // Charts
  const top10 = treasuries.slice(0, 10);
  const top5 = treasuries.slice(0, 5);

  const barLabels = top10.map(t => t.company_name);
  const barConfig = createBarChart(
    [
      {
        label: 'BTC Holdings',
        data: top10.map(t => t.btc_holdings),
      },
    ],
    barLabels,
    {
      indexAxis: 'y',
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => `${formatNumber(context.raw)} BTC`,
          },
        },
      },
    }
  );

  const doughnutLabels = top5.map(t => t.company_name);
  const doughnutData = top5.map(t => t.btc_holdings);
  const doughnutConfig = createDoughnutChart(
    doughnutLabels,
    doughnutData,
    {
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => `${context.label}: ${formatNumber(context.raw)} BTC`,
          },
        },
      },
    }
  );

  // Pagination
  const totalPages = Math.ceil(treasuries.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentData = treasuries.slice(startIdx, startIdx + itemsPerPage);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerContainer}>
        <div>
          <h3 className={styles.title}>Top Bitcoin Holders by Company</h3>
          <p className={styles.subtitle}>Individual company holdings and rankings</p>
        </div>
        <div className={styles.statusIndicator}>
          <div className={`${styles.statusDot} ${treasuriesLoading ? styles.loading : styles.live}`} />
          {treasuriesLoading ? 'Updating...' : 'Live Data'}
        </div>
      </div>

      {/* Charts */}
      <div className={styles.chartsGrid}>
        <Card className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Top 10 Bitcoin Holders</h3>
          <div className={styles.chartContainer}>
            <Bar data={barConfig.data} options={barConfig.options} />
          </div>
        </Card>

        <Card className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Top 5 Distribution</h3>
          <div className={styles.chartContainer}>
            <Doughnut data={doughnutConfig.data} options={doughnutConfig.options} />
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div>#</div>
          <div>COMPANY</div>
          <div>BTC HOLDINGS</div>
          <div>USD VALUE</div>
          <div>% OF SUPPLY</div>
          <div>COUNTRY</div>
        </div>

        {currentData.map((treasury, idx) => (
          <div
            key={treasury.id}
            className={`${styles.tableRow} ${idx < currentData.length - 1 ? styles.withBorder : ''}`}
            onClick={() => setSelectedCompany(treasury)}
          >
            <div className={styles.rank}>{startIdx + idx + 1}</div>
            <div className={styles.company}>{treasury.company_name}</div>
            <div className={styles.holdings}>{formatNumber(treasury.btc_holdings)} BTC</div>
            <div className={styles.value}>${formatNumber(treasury.usd_value)}</div>
            <div className={styles.percentage}>{treasury.percentage_of_supply?.toFixed(4)}%</div>
            <div className={styles.country}>{treasury.country}</div>
          </div>
        ))}
      </Card>

      {/* Pagination */}
      <div className={styles.pagination}>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
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
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={styles.paginationButton}
          aria-label="Next page"
        >
          Next
        </button>
      </div>

      {/* Modal */}
      {selectedCompany && (
        <CompanyDetailModal
          company={selectedCompany}
          btcPrice={btcPrice}
          onClose={() => setSelectedCompany(null)}
        />
      )}
    </div>
  );
}

export default CorporateTreasuries;
