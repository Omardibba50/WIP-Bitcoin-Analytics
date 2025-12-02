import React, { useState } from 'react';
import CorrelationDashboard from './CorrelationDashboard';
import CorporateTreasuries from './CorporateTreasuries';
import BlockchainBlocks from './BlockchainBlocks';
import BitcoinMetrics from './BitcoinMetrics';
import styles from './DataTabs.module.css';

/**
 * DataTabs - Tabbed interface for heavy data sections
 * Syncs with header navigation
 */
const DataTabs = ({ correlations, treasuries, symbol, activeTab: externalActiveTab, onTabChange }) => {
  const [internalActiveTab, setInternalActiveTab] = useState('correlations');
  
  // Map overview to correlations, otherwise use external or internal state
  const activeTab = externalActiveTab === 'overview' ? 'correlations' : externalActiveTab || internalActiveTab;

  const tabs = [
    { id: 'correlations', label: 'Correlations' },
    { id: 'treasuries', label: 'Corporate Holdings' },
    { id: 'blocks', label: 'Recent Blocks' },
    { id: 'metrics', label: 'All Metrics' },
  ];

  const handleTabClick = (tabId) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalActiveTab(tabId);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'correlations' && (
          <CorrelationDashboard data={correlations} />
        )}
        {activeTab === 'treasuries' && (
          <CorporateTreasuries data={treasuries} />
        )}
        {activeTab === 'blocks' && (
          <BlockchainBlocks />
        )}
        {activeTab === 'metrics' && (
          <BitcoinMetrics symbol={symbol} />
        )}
      </div>
    </div>
  );
};

export default DataTabs;
