import React, { useState, useCallback } from 'react';
import DashboardHeader from './DashboardHeader';
import HeroSection from './HeroSection';
import AIPredictionChart from './AIPredictionChart';
import HashRateChart from './HashRateChart';
import DifficultyChart from './DifficultyChart';
import StockFlowChart from './StockFlowChart';
import PriceChart from './PriceChart';
import BlockchainBlocks from './BlockchainBlocks';
import CorporateTreasuries from './CorporateTreasuries';
import BitcoinMetrics from './BitcoinMetrics';
import DataTabs from './DataTabs';
import MiningEconomics from './MiningEconomics';
import { LoadingSpinner, Card } from '../components/ui';
import styles from './MainDashboard.module.css';
import { useDashboardData } from '../hooks/useDashboardData';

/**
 * Main Dashboard Component - Modern Grid Layout
 * 
 * Features:
 * - Hero section with prominent price display
 * - 2-column grid for secondary metrics
 * - Tabbed interface for heavy data
 * - Progressive 3-tier loading (critical/secondary/tertiary)
 * - Clean, modern, spacious design
 * - Responsive grid system
 */
const MainDashboard = () => {
  // Local UI State
  const [searchTerm] = useState('BTC');
  const [startDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate] = useState(new Date());
  const [activeSection, setActiveSection] = useState('overview');

  // Handle section changes from header navigation with smooth scrolling
  const handleSectionChange = useCallback((section) => {
    setActiveSection(section);
    
    // Map section IDs to scroll targets
    const sectionMap = {
      'overview': 'overview',
      'correlations': 'analytics', 
      'treasuries': 'analytics',
      'blocks': 'analytics',
      'metrics': 'analytics'
    };
    
    const targetId = sectionMap[section] || 'overview';
    const element = document.getElementById(targetId);
    
    if (element) {
      // Smooth scroll to section with offset for header
      const headerOffset = 80; // Adjust based on header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  // Dashboard Data with Progressive Loading
  const {
    // Tier 1 - Critical Data
    priceSummary,
    latestBlock,
    aiPrediction,
    // Tier 2 - Secondary Data
    priceHistory,
    allTimeHigh,
    models,
    treasuries,
    mempoolStats,
    miningEconomics,
    // Tier 3 - Background Data
    correlations,
    lightningStats,
    hashrateHistory,
    difficultyHistory,
    // Loading States
    isCriticalLoading,
    isSecondaryLoading,
    isBackgroundLoading,
    // Errors
    errors,
    // Controls
    initialize,
    refreshTier
  } = useDashboardData();

  // Removed filter handlers - simplified UI

  // Derived safety wrappers
  const safePriceSummary = priceSummary && typeof priceSummary === 'object' ? priceSummary : null;
  const safeModels = Array.isArray(models) ? models : [];
  const safePriceHistory = Array.isArray(priceHistory) ? priceHistory : [];
  const safeDifficultyHistory = Array.isArray(difficultyHistory) ? difficultyHistory : [];
  const safeHashrateHistory = Array.isArray(hashrateHistory) ? hashrateHistory : [];
  const safeTreasuries = Array.isArray(treasuries) ? treasuries : [];
  const safeCorrelations = Array.isArray(correlations) ? correlations : [];

  return (
    <div className={styles.dashboardBg}>
      {/* Header with coordinated navigation */}
      <DashboardHeader 
        symbol={searchTerm} 
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      <main className={styles.mainContent}>
        {/* Critical Loading State */}
        {isCriticalLoading && (
          <div className={styles.loadingContainer}>
            <LoadingSpinner size="large" />
            <p>Loading market data...</p>
          </div>
        )}

        {/* Error State - Only show if no data at all */}
        {errors.critical && !isCriticalLoading && !priceSummary && (
          <div className={styles.errorContainer}>
            <p>Failed to load critical data</p>
            <button
              className={styles.retryButton}
              onClick={() => refreshTier('critical')}
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Dashboard Content - Show everything on overview */}
        {!isCriticalLoading && (
          <>
            {/* Hero Section - Prominent Price Display with AI Prediction */}
            <section id="overview" className={styles.heroSection}>
              <HeroSection 
                priceSummary={safePriceSummary}
                aiPrediction={aiPrediction}
                allTimeHigh={allTimeHigh}
                latestBlock={latestBlock}
                miningEconomics={miningEconomics}
                lightningStats={lightningStats}
                models={models}
                hashrateHistory={safeHashrateHistory}
              />
            </section>

            {/* 2-Column Chart Grid - Price History & AI Prediction */}
            <section id="charts" className={styles.chartsGridMain}>
              <Card className={styles.chartCard}>
                <h3 className={styles.chartCardTitle}>Bitcoin Price History</h3>
                <div className={styles.chartContainer}>
                  {safePriceHistory.length > 0 ? (
                    <PriceChart
                      priceHistory={safePriceHistory}
                      symbol={searchTerm}
                      startDate={startDate}
                      endDate={endDate}
                    />
                  ) : (
                    <div className={styles.emptyState}>No price history available</div>
                  )}
                </div>
              </Card>

              <div className={styles.aiPredictionChart}>
                <AIPredictionChart prediction={aiPrediction} />
              </div>
            </section>

            {/* Network Charts Grid - 3 columns */}
            <section id="network" className={styles.section}>
              <h2 className={styles.sectionTitle}>Network Health</h2>
              <div className={styles.chartsGrid}>
                <HashRateChart data={safeHashrateHistory} />
                <DifficultyChart data={safeDifficultyHistory} />
                <StockFlowChart />
              </div>
            </section>

            {/* Mining Economics */}
            <section id="mining" className={styles.section}>
              <MiningEconomics data={miningEconomics} />
            </section>

            {/* Advanced Analytics - All data sections */}
            <section id="analytics" className={styles.section}>
              <h2 className={styles.sectionTitle}>Advanced Analytics</h2>
              <DataTabs
                correlations={safeCorrelations}
                treasuries={safeTreasuries}
                symbol={searchTerm}
                activeTab={activeSection}
                onTabChange={handleSectionChange}
              />
            </section>
          </>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className={styles.footer}>
        <p> {new Date().getFullYear()} Bitcoin Analytics Dashboard</p>
        <div className={styles.footerLinks}>
          <a href="https://github.com/MamidiPavanReddy" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
};

// MetricTile Helper Component
const MetricTile = ({ label, value }) => (
  <div>
    <div style={{ 
      color: 'var(--color-text-secondary)', 
      fontSize: 'var(--font-size-sm)',
      marginBottom: 'var(--spacing-xs)'
    }}>
      {label}
    </div>
    <div style={{ 
      color: 'var(--color-text-primary)', 
      fontWeight: 'var(--font-weight-bold)',
      fontSize: 'var(--font-size-lg)'
    }}>
      {value}
    </div>
  </div>
);

export default MainDashboard;
