import React from 'react';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';

function PriceCards({ priceSummary, allTimeHigh, predictions, models }) {
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

  const getPredictedPrice = () => {
    if (!predictions || predictions.length === 0) return '—';
    const latestPrediction = predictions[predictions.length - 1];
    return formatCurrency(latestPrediction.predicted_price, { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    });
  };

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
      value: allTimeHigh ? formatCurrency(allTimeHigh.price) : '—',
      type: 'accent'
    },
    {
      title: 'ATH DATE',
      value: allTimeHigh ? formatDate(allTimeHigh.ts) : '—',
      type: 'info'
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem'
    }}>
      {tiles.map((tile, idx) => (
        <div
          key={idx}
          style={{
            background: 'rgba(30, 30, 40, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '1.5rem',
            transition: 'all 0.3s ease',
            cursor: 'default'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = 'rgba(0, 179, 255, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          <div style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '0.75rem',
            letterSpacing: '0.5px'
          }}>
            {tile.title}
          </div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: tile.type === 'negative' ? '#ff6b6b' :
                   tile.type === 'positive' ? '#4ade80' :
                   tile.type === 'accent' ? '#00b3ff' :
                   tile.type === 'info' ? '#a78bfa' :
                   '#ffffff'
          }}>
            {tile.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PriceCards;
