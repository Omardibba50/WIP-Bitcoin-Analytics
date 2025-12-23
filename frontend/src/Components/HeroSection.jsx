import React, { useState } from 'react';
import styles from './HeroSection.module.css';

/**
 * Hero Section - Professional price display with AI prediction and network stats
 * Corporate design without emojis
 */
const HeroSection = ({ priceSummary, aiPrediction, allTimeHigh, latestBlock, miningEconomics, lightningStats, models, hashrateHistory }) => {
  // Debug logging to see actual data structure
  if (priceSummary && Object.keys(priceSummary).length > 0) {
    console.log('💰 Price Summary Structure:', Object.keys(priceSummary));
    console.log('💰 Full Price Summary:', priceSummary);
  }
  
  if (aiPrediction) {
    console.log('🎯 AI Prediction RAW:', aiPrediction);
    console.log('🎯 Prediction Keys:', Object.keys(aiPrediction));
  }
  
  // Handle different API response structures
  const currentPrice = priceSummary?.currentPrice || priceSummary?.price || priceSummary?.current_price || 0;
  const change24h = priceSummary?.change24hPct || priceSummary?.change_24h_pct || priceSummary?.price_change_percentage_24h || 0;
  const change24hAbs = priceSummary?.change24hAbs || priceSummary?.change_24h || priceSummary?.price_change_24h || 0;
  
  // Volume and Market Cap with nested property support
  const volume24h = priceSummary?.volume24h || 
                    priceSummary?.volume_24h || 
                    priceSummary?.total_volume || 
                    priceSummary?.market_data?.total_volume?.usd || 0;
  
  const marketCap = priceSummary?.marketCap || 
                    priceSummary?.market_cap || 
                    priceSummary?.market_cap_usd || 
                    priceSummary?.market_data?.market_cap?.usd || 0;
  
  // State for horizon selection
  const [selectedHorizon, setSelectedHorizon] = useState('1h');
  
  // Handle multi-horizon predictions (new format) or single prediction (backward compatible)
  const isMultiHorizon = aiPrediction && typeof aiPrediction === 'object' && ('1h' in aiPrediction || '24h' in aiPrediction || '7d' in aiPrediction);
  
  let prediction;
  if (isMultiHorizon) {
    // New multi-horizon format
    prediction = aiPrediction[selectedHorizon] || aiPrediction['1h'] || null;
  } else {
    // Old single prediction format (backward compatible)
    prediction = aiPrediction;
  }
  
  const predictedPrice = prediction?.predicted_price || 0;
  const predictedLow = prediction?.predicted_low || 0;
  const predictedHigh = prediction?.predicted_high || 0;
  const confidence = prediction?.confidence || 0;
  const hasRange = predictedLow > 0 && predictedHigh > 0;
  
  // Extract context indicators
  const context = prediction?.context || (isMultiHorizon ? aiPrediction?.context : null);
  const hasContext = context && context.rsi !== undefined;
  
  console.log('🔍 PREDICTION DATA:');
  console.log('   aiPrediction:', aiPrediction);
  console.log('   isMultiHorizon:', isMultiHorizon);
  console.log('   selectedHorizon:', selectedHorizon);
  console.log('   prediction object:', prediction);
  console.log('   predictedPrice:', predictedPrice);
  console.log('   confidence:', confidence);
  
  const isPositive = change24h >= 0;
  
  // Calculate ATH details
  const getATHDetails = () => {
    if (!allTimeHigh || !currentPrice) {
      return {
        price: '—',
        decline: '—',
        date: '—'
      };
    }
    
    const declinePercent = allTimeHigh.price > 0 
      ? ((allTimeHigh.price - currentPrice) / allTimeHigh.price * 100).toFixed(2)
      : '—';
    
    return {
      price: `$${allTimeHigh.price.toLocaleString('en-US', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
      })}`,
      decline: declinePercent !== '—' ? `-${declinePercent}%` : '—',
      date: allTimeHigh.date || '—'
    };
  };
  
  const athDetails = getATHDetails();
  
  // Extract network stats data (same logic as KeyMetrics)
  const blockHeight = latestBlock?.height || latestBlock?.block_height || 0;
  const blockTime = latestBlock?.timestamp ? new Date(latestBlock.timestamp * 1000).toLocaleTimeString() : '--:--';
  
  const hashrate = miningEconomics?.hashrate || miningEconomics?.network_hashrate || miningEconomics?.current_hashrate || 
                  (hashrateHistory && hashrateHistory.length > 0 ? hashrateHistory[hashrateHistory.length - 1]?.hashrate : 0) || 0;
  const difficulty = miningEconomics?.difficulty || miningEconomics?.current_difficulty || miningEconomics?.network_difficulty || latestBlock?.difficulty || 0;
  
  const lightningCapacity = lightningStats?.capacity_btc || lightningStats?.capacity || lightningStats?.totalCapacity || lightningStats?.total_capacity || 0;
  const lightningChannels = lightningStats?.channels || lightningStats?.totalChannels || lightningStats?.total_channels || 0;
  const lightningNodes = lightningStats?.nodes || lightningStats?.totalNodes || lightningStats?.total_nodes || 0;
  
  const activeModels = Array.isArray(models) ? models.length : (models && typeof models === 'object' ? Object.keys(models).length : 0);
  
  const formatHashrate = (hash) => {
    if (hash >= 1e18) return `${(hash / 1e18).toFixed(2)} EH/s`;
    if (hash >= 1e15) return `${(hash / 1e15).toFixed(2)} PH/s`;
    if (hash >= 1e12) return `${(hash / 1e12).toFixed(2)} TH/s`;
    if (hash >= 1e9) return `${(hash / 1e9).toFixed(2)} GH/s`;
    if (hash >= 1e6) return `${(hash / 1e6).toFixed(2)} MH/s`;
    return `${hash.toFixed(2)} H/s`;
  };
  
  const formatDifficulty = (diff) => {
    if (diff >= 1e12) return `${(diff / 1e12).toFixed(2)}T`;
    if (diff >= 1e9) return `${(diff / 1e9).toFixed(2)}B`;
    return diff.toLocaleString();
  };
  
  const formatLargeNumber = (num) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <section className={styles.hero}>
      <div className={styles.heroGrid}>
        {/* Current Bitcoin Price */}
        <div className={styles.currentPriceCard} style={{ gridArea: 'price' }}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Bitcoin Price</span>
            <span className={styles.liveBadge}>● LIVE</span>
          </div>
          <div className={styles.priceDisplay}>
            <div className={styles.currentLabel}>Current Price</div>
            <div className={styles.price}>
              {currentPrice > 0 ? (
                `$${currentPrice.toLocaleString('en-US', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}`
              ) : (
                <span style={{ color: 'var(--color-text-tertiary)' }}>Loading...</span>
              )}
            </div>
            <div className={`${styles.change} ${isPositive ? styles.positive : styles.negative}`}>
              {isPositive ? '▲' : '▼'} {Math.abs(change24h * 100).toFixed(2)}% (24h)
            </div>
          </div>
          <div className={styles.priceStats}>
            <div className={styles.priceStatItem}>
              <span className={styles.priceStatLabel}>Volume 24h</span>
              <span className={styles.priceStatValue}>{formatLargeNumber(volume24h)}</span>
            </div>
            <div className={styles.priceStatItem}>
              <span className={styles.priceStatLabel}>Market Cap</span>
              <span className={styles.priceStatValue}>{formatLargeNumber(marketCap)}</span>
            </div>
          </div>
        </div>

        {/* All-Time High Card */}
        <div className={styles.athCard} style={{ gridArea: 'ath' }}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>All-Time High</span>
          </div>
          <div className={styles.athDisplay}>
            <div className={styles.athPrice}>{athDetails.price}</div>
            <div className={styles.athDetails}>
              <div className={styles.athItem}>
                <span className={styles.athLabel}>Decline from ATH:</span>
                <span className={`${styles.athValue} ${styles.athDecline}`}>{athDetails.decline}</span>
              </div>
              <div className={styles.athItem}>
                <span className={styles.athLabel}>ATH Date:</span>
                <span className={styles.athValue}>{athDetails.date}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Network Stats Card */}
        <div className={styles.networkStatsCard} style={{ gridArea: 'network' }}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Network Statistics</span>
          </div>
          <div className={styles.networkStatsGrid}>
            <div className={styles.networkStatItem}>
              <span className={styles.networkStatLabel}>Latest Block</span>
              <span className={styles.networkStatValue}>{blockHeight > 0 ? blockHeight.toLocaleString() : '—'}</span>
              <span className={styles.networkStatSubtitle}>{blockTime}</span>
            </div>
            <div className={styles.networkStatItem}>
              <span className={styles.networkStatLabel}>Network Hashrate</span>
              <span className={styles.networkStatValue}>{hashrate > 0 ? formatHashrate(hashrate) : '—'}</span>
              <span className={styles.networkStatSubtitle}>Computing Power</span>
            </div>
            <div className={styles.networkStatItem}>
              <span className={styles.networkStatLabel}>Mining Difficulty</span>
              <span className={styles.networkStatValue}>{difficulty > 0 ? formatDifficulty(difficulty) : '—'}</span>
              <span className={styles.networkStatSubtitle}>Current Epoch</span>
            </div>
            <div className={styles.networkStatItem}>
              <span className={styles.networkStatLabel}>AI Models Active</span>
              <span className={styles.networkStatValue}>{activeModels > 0 ? activeModels.toString() : '0'}</span>
              <span className={styles.networkStatSubtitle}>Prediction Models</span>
            </div>
            <div className={styles.networkStatItem}>
              <span className={styles.networkStatLabel}>Lightning Network</span>
              <span className={styles.networkStatValue}>{lightningCapacity > 0 ? `${lightningCapacity} BTC` : '—'}</span>
              <span className={styles.networkStatSubtitle}>
                {lightningChannels > 0 && lightningNodes > 0 
                  ? `${lightningChannels.toLocaleString()} Channels • ${lightningNodes.toLocaleString()} Nodes`
                  : lightningChannels > 0 
                    ? `${lightningChannels.toLocaleString()} Channels` 
                    : 'No data'
                }
              </span>
            </div>
          </div>
        </div>

        {/* AI Price Prediction - Always visible */}
        <div className={styles.predictionCard} style={{ gridArea: 'prediction' }}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>AI Price Prediction</span>
            <span className={styles.liveBadge}>● LIVE</span>
          </div>
          
          {/* Horizon Selector - Only show if multi-horizon data available */}
          {isMultiHorizon && (
            <div className={styles.horizonSelector}>
              {['1h', '24h', '7d'].map(horizon => (
                <button
                  key={horizon}
                  className={`${styles.horizonButton} ${selectedHorizon === horizon ? styles.active : ''}`}
                  onClick={() => setSelectedHorizon(horizon)}
                >
                  {horizon.toUpperCase()}
                </button>
              ))}
            </div>
          )}
          
          <div className={styles.predictionDisplay}>
            <div className={styles.predictionRow}>
              <div className={styles.predictionCol}>
                <div className={styles.predLabel}>Current Price</div>
                <div className={styles.predValue}>
                  {currentPrice > 0 ? (
                    `$${currentPrice.toLocaleString('en-US', { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2 
                    })}`
                  ) : (
                    <span style={{ color: 'var(--color-text-tertiary)' }}>Loading...</span>
                  )}
                </div>
              </div>
              <div className={styles.predictionCol}>
                <div className={styles.predLabel}>Predicted Price ({selectedHorizon})</div>
                <div className={styles.predValue}>
                  {predictedPrice > 0 ? (
                    <>
                      ${predictedPrice.toLocaleString('en-US', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                      })}
                      {hasRange && (
                        <div className={styles.priceRange}>
                          Range: ${predictedLow.toLocaleString('en-US', { maximumFractionDigits: 0 })} - ${predictedHigh.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </div>
                      )}
                    </>
                  ) : (
                    <span style={{ color: 'var(--color-text-tertiary)' }}>Loading...</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Blue Confidence Progress Bar */}
            <div className={styles.confidenceSection}>
              <div className={styles.confidenceHeader}>
                <span className={styles.confidenceLabel}>Prediction Confidence</span>
                <span className={styles.confidenceValue}>{confidence > 0 ? `${(confidence * 100).toFixed(1)}%` : '—'}</span>
              </div>
              <div className={styles.confidenceBar}>
                <div 
                  className={styles.confidenceFill}
                  style={{ width: `${confidence > 0 ? confidence * 100 : 0}%` }}
                />
              </div>
              <div className={styles.predictionMeta}>
                <span className={styles.metaItem}>Model: {prediction?.model_type || 'LSTM'}</span>
                {prediction?.timestamp && (
                  <span className={styles.metaItem}>Updated: {new Date(prediction.timestamp).toLocaleTimeString()}</span>
                )}
              </div>
              
              {/* Context Indicators */}
              {hasContext && (
                <div className={styles.contextIndicators}>
                  <div className={styles.contextItem}>
                    <span className={styles.contextLabel}>RSI (14)</span>
                    <span className={`${styles.contextValue} ${styles[`rsi-${context.rsi_state}`]}`}>
                      {context.rsi.toFixed(1)} <span className={styles.contextBadge}>{context.rsi_state}</span>
                    </span>
                  </div>
                  <div className={styles.contextItem}>
                    <span className={styles.contextLabel}>Trend</span>
                    <span className={`${styles.contextValue} ${styles[`trend-${context.trend}`]}`}>
                      {context.trend === 'bullish' ? '↑' : '↓'} {context.trend}
                    </span>
                  </div>
                  <div className={styles.contextItem}>
                    <span className={styles.contextLabel}>Volatility</span>
                    <span className={`${styles.contextValue} ${styles[`vol-${context.volatility_regime}`]}`}>
                      {context.volatility.toFixed(2)}% <span className={styles.contextBadge}>{context.volatility_regime}</span>
                    </span>
                  </div>
                </div>
              )}
              
              <div className={styles.disclaimer}>
                Not investment advice. Confidence is volatility-derived.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
