import React from 'react';
import { useDataFetch } from '../hooks/useDataFetch';
import { aiApi } from '../services/apiClient';
import { formatCurrency, formatDate } from '../utils/formatters';
import styles from './PriceCards.module.css';

function PriceCards({ priceSummary, allTimeHigh, predictions, models }) {
  const { data: aiPrediction } = useDataFetch(
    () => aiApi.getLatestPrediction(),
    {
      interval: 300000, // 5 minutes
      priority: 'critical'
    }
  );

  const get24hChangeDisplay = () => {
    if (!priceSummary || priceSummary.change24hPct == null) {
      return { value: '—', isNegative: false };
    }
    
    const changePercent = (priceSummary.change24hPct * 100).toFixed(2);
    const isNegative = priceSummary.change24hPct < 0;
    return {
      value: `${isNegative ? '' : '+'}${changePercent}%`,
      isNegative
    };
  };

  const getATHDetails = () => {
    if (!allTimeHigh || !priceSummary) {
      return {
        price: '—',
        decline: '—',
        date: '—'
      };
    }
    
    // Calculate decline from ATH
    const declinePercent = priceSummary.currentPrice && allTimeHigh.price > 0 
      ? ((allTimeHigh.price - priceSummary.currentPrice) / allTimeHigh.price * 100).toFixed(2)
      : '—';
    
    return {
      price: formatCurrency(allTimeHigh.price),
      decline: declinePercent !== '—' ? `-${declinePercent}%` : '—',
      date: formatDate(allTimeHigh.ts)
    };
  };

  const getPredictedPrice = () => {
    if (aiPrediction?.prediction?.predicted_price) {
      return formatCurrency(aiPrediction.prediction.predicted_price, { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      });
    }
    if (!predictions || predictions.length === 0) return '—';
    const latestPrediction = predictions[predictions.length - 1];
    return formatCurrency(latestPrediction.predicted_price, { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    });
  };

  const athDetails = getATHDetails();

  const change24h = get24hChangeDisplay();

  const tiles = [
    {
      title: 'CURRENT BTC PRICE',
      value: priceSummary ? formatCurrency(priceSummary.currentPrice) : '—',
      type: 'normal'
    },
    {
      title: '24 HOURS PERFORMANCE',
      value: change24h.value,
      type: change24h.isNegative ? 'negative' : 'positive'
    },
    {
      title: 'PRICE CHANGE IN 24 HRS',
      value: priceSummary && priceSummary.change24hAbs != null ? 
        `${priceSummary.change24hAbs >= 0 ? '+' : ''}${priceSummary.change24hAbs.toFixed(2)} USD` : 
        '—',
      type: priceSummary && priceSummary.change24hAbs != null && priceSummary.change24hAbs < 0 ? 'negative' : 'positive'
    },
    {
      title: 'PREDICTED PRICE',
      value: getPredictedPrice(),
      type: 'accent'
    },
    {
      title: 'MODELS LOADED',
      value: models?.length?.toString() || '0',
      type: 'info'
    },
    {
      title: 'ALL-TIME HIGH',
      value: athDetails.price,
      subtitle: `Decline from ATH: ${athDetails.decline}`,
      type: 'accent',
      customContent: (
        <div className={styles.athDetails}>
          <div className={styles.athItem}>
            <span className={styles.athLabel}>ATH Date:</span>
            <span className={styles.athValue}>{athDetails.date}</span>
          </div>
        </div>
      )
    },
  ];

  return (
    <div className={styles.grid}>
      {tiles.map((tile, idx) => (
        <div key={idx} className={`${styles.card} ${styles[tile.type]}`}>
          <div className={styles.title}>{tile.title}</div>
          <div className={styles.value}>{tile.value}</div>
          {tile.subtitle && (
            <div className={styles.subtitle}>{tile.subtitle}</div>
          )}
          {tile.customContent && (
            <div className={styles.customContentContainer}>
              {tile.customContent}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default PriceCards;
