import React, { useEffect, useState } from 'react';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';
import { aiApi } from '../services/api';
import { colors, spacing, borderRadius, shadows, transitions } from '../styles/designSystem';

function PriceCards({ priceSummary, allTimeHigh, predictions, models }) {
  const [aiPrediction, setAiPrediction] = useState(null);

  // Fetch AI prediction
  useEffect(() => {
    const fetchAIPrediction = async () => {
      try {
        const data = await aiApi.getLatestPrediction();
        setAiPrediction(data);
      } catch (err) {
        console.error('Failed to fetch AI prediction:', err);
      }
    };
    
    fetchAIPrediction();
    const interval = setInterval(fetchAIPrediction, 5 * 60 * 1000); // Refresh every 5 min
    return () => clearInterval(interval);
  }, []);

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
    // Use AI prediction if available
    if (aiPrediction?.prediction?.predicted_price) {
      return formatCurrency(aiPrediction.prediction.predicted_price, { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      });
    }
    // Fallback to old predictions
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
      gap: spacing.md,
      marginBottom: spacing.xl
    }}>
      {tiles.map((tile, idx) => (
        <div
          key={idx}
          style={{
            background: colors.cardBg,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: borderRadius.lg,
            padding: spacing.xl,
            transition: transitions.normal,
            cursor: 'default',
            boxShadow: shadows.md
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = colors.cardBorderHover;
            e.currentTarget.style.boxShadow = shadows.glow;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = colors.cardBorder;
            e.currentTarget.style.boxShadow = shadows.md;
          }}
        >
          <div style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            color: colors.textSecondary,
            marginBottom: spacing.sm,
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            {tile.title}
          </div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: tile.type === 'negative' ? colors.error : 
                   tile.type === 'positive' ? colors.success : 
                   tile.type === 'accent' ? colors.accent : colors.textPrimary
          }}>
            {tile.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PriceCards;
