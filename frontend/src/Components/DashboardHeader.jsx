import React, { useState, useEffect } from 'react';
import styles from './DashboardHeader.module.css';

/**
 * Dashboard Header Component - Professional with Navigation
 */
const DashboardHeader = ({ symbol = 'BTC', activeSection = 'overview', onSectionChange }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setActiveTab(activeSection || 'overview');
  }, [activeSection]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    if (onSectionChange) {
      onSectionChange(tabId);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'correlations', label: 'Correlations' },
    { id: 'treasuries', label: 'Corporate Holdings' },
    { id: 'blocks', label: 'Recent Blocks' },
    { id: 'metrics', label: 'All Metrics' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <div className={styles.logoLink} onClick={() => handleTabClick('overview')}>
            <div className={styles.logoIcon}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 10h6c1.1 0 2 .9 2 2 0 .74-.4 1.38-1 1.73.6.35 1 .99 1 1.73 0 1.1-.9 2-2 2h-6V10zm2 3h3c.55 0 1-.45 1-1s-.45-1-1-1h-3v2zm0 4h3c.55 0 1-.45 1-1s-.45-1-1-1h-3v2z" fill="currentColor"/>
                <path d="M15 8v2M15 22v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className={styles.logoText}>
              <h1 className={styles.title}>Bitcoin Analytics</h1>
            </div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className={styles.mobileMenuButton}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>

        {/* Desktop Navigation */}
        <nav className={styles.nav}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.navTab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className={styles.actions}>
          <span className={styles.badge}>{symbol}</span>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className={styles.mobileNav}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.mobileNavTab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;
