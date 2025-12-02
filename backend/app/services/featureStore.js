/**
 * FeatureStore - Feature Engineering Service for Bitcoin Price Prediction
 * 
 * Computes 15 features from raw price, hashrate, and difficulty data:
 * - 5 Price features (log returns, moving averages, volatility, RSI)
 * - 2 On-chain features (hashrate, difficulty normalized)
 * - 2 Temporal features (hour/day cycles)
 * 
 * Author: AI Price Prediction System
 * Date: November 28, 2025
 */

import { getHistory, getAtOrBefore } from '../db/pricesDb.js';
import { getHashrateHistory } from '../db/hashrateDb.js';
import { getDifficultyHistory } from '../db/difficultyDb.js';

export class FeatureStore {
  constructor() {
    this.stats = {
      price: { min: null, max: null, mean: null, std: null },
      hashrate: { min: null, max: null, mean: null, std: null },
      difficulty: { min: null, max: null, mean: null, std: null },
      volume: { min: null, max: null, mean: null, std: null }
    };
    this.statsComputed = false;
  }

  /**
   * Compute normalization statistics from historical data
   * Must be called once before feature computation
   */
  async computeStats(symbol = 'BTC') {
    console.log('📊 Computing normalization statistics...');
    
    const now = Date.now();
    const startTime = now - (365 * 24 * 60 * 60 * 1000); // 1 year back
    
    // Get all price data
    const prices = await getHistory(symbol, startTime, now, 10000);
    const priceValues = prices.map(p => p.price);
    
    this.stats.price = this._computeStats(priceValues);
    
    // Get hashrate data
    const hashrates = await getHashrateHistory(startTime, now, 1000);
    const hashrateValues = hashrates.map(h => h.hashrate);
    
    if (hashrateValues.length > 0) {
      this.stats.hashrate = this._computeStats(hashrateValues);
    }
    
    // Get difficulty data
    const difficulties = await getDifficultyHistory(startTime, now, 1000);
    const difficultyValues = difficulties.map(d => d.difficulty);
    
    if (difficultyValues.length > 0) {
      this.stats.difficulty = this._computeStats(difficultyValues);
    }
    
    this.statsComputed = true;
    console.log('✅ Statistics computed:', {
      price: `$${Math.round(this.stats.price.min).toLocaleString()} - $${Math.round(this.stats.price.max).toLocaleString()}`,
      hashrate: this.stats.hashrate.min ? `${(this.stats.hashrate.min / 1e18).toFixed(2)}EH/s - ${(this.stats.hashrate.max / 1e18).toFixed(2)}EH/s` : 'N/A',
      difficulty: this.stats.difficulty.min ? `${(this.stats.difficulty.min / 1e12).toFixed(2)}T - ${(this.stats.difficulty.max / 1e12).toFixed(2)}T` : 'N/A'
    });
  }

  /**
   * Compute features for a given timestamp with lookback window
   * @param {string} symbol - Asset symbol (e.g., 'BTC')
   * @param {number} timestamp - Target timestamp (ms)
   * @param {number} lookback - Number of timesteps to look back (default 60)
   * @returns {Array<Object>} Array of feature objects for each timestep
   */
  async computeFeatures(symbol, timestamp, lookback = 60) {
    if (!this.statsComputed) {
      throw new Error('Statistics not computed. Call computeStats() first.');
    }

    const endTime = timestamp;
    const startTime = timestamp - (lookback * 2 * 60 * 60 * 1000); // Extra buffer for calculations
    
    // Fetch raw data
    const prices = await getHistory(symbol, startTime, endTime, lookback * 2);
    
    if (prices.length < lookback + 24) {
      throw new Error(`Insufficient price data: need ${lookback + 24}, got ${prices.length}`);
    }

    // Get on-chain data (may be sparse)
    const hashrates = await getHashrateHistory(startTime, endTime, lookback * 2);
    const difficulties = await getDifficultyHistory(startTime, endTime, lookback * 2);

    const features = [];
    
    // Compute features for each timestep in the lookback window
    for (let i = prices.length - lookback; i < prices.length; i++) {
      const currentPrice = prices[i];
      
      features.push({
        timestamp: currentPrice.ts,
        
        // Price features
        log_return_1h: this._logReturn(prices, i, 1),
        log_return_4h: this._logReturn(prices, i, 4),
        log_return_24h: this._logReturn(prices, i, 24),
        sma_24h: this._sma(prices, i, 24),
        volatility_24h: this._volatility(prices, i, 24),
        rsi_14: this._rsi(prices, i, 14),
        
        // On-chain features (with fallback)
        hashrate_normalized: this._getHashrateFeature(hashrates, currentPrice.ts),
        difficulty_normalized: this._getDifficultyFeature(difficulties, currentPrice.ts),
        
        // Temporal features
        hour_sin: Math.sin(2 * Math.PI * new Date(currentPrice.ts).getUTCHours() / 24),
        day_cos: Math.cos(2 * Math.PI * new Date(currentPrice.ts).getUTCDay() / 7),
        
        // Store raw price for reference
        _price: currentPrice.price
      });
    }
    
    return features;
  }

  /**
   * Log return calculation
   */
  _logReturn(prices, idx, periods) {
    if (idx < periods) return 0;
    const current = prices[idx].price;
    const past = prices[idx - periods].price;
    if (past <= 0 || current <= 0) return 0;
    return Math.log(current / past);
  }

  /**
   * Simple Moving Average
   */
  _sma(prices, idx, window) {
    if (idx < window - 1) return 0;
    
    let sum = 0;
    for (let i = idx - window + 1; i <= idx; i++) {
      sum += prices[i].price;
    }
    const sma = sum / window;
    
    // Normalize relative to current price
    return (prices[idx].price - sma) / prices[idx].price;
  }

  /**
   * Volatility (rolling standard deviation)
   */
  _volatility(prices, idx, window) {
    if (idx < window) return 0;
    
    // Calculate returns
    const returns = [];
    for (let i = idx - window + 1; i <= idx; i++) {
      if (i > 0) {
        returns.push(Math.log(prices[i].price / prices[i - 1].price));
      }
    }
    
    if (returns.length === 0) return 0;
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Relative Strength Index (RSI)
   */
  _rsi(prices, idx, period = 14) {
    if (idx < period) return 50; // Neutral RSI
    
    let gains = 0;
    let losses = 0;
    
    for (let i = idx - period + 1; i <= idx; i++) {
      const change = prices[i].price - prices[i - 1].price;
      if (change > 0) {
        gains += change;
      } else {
        losses -= change; // Make positive
      }
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    // Normalize to [-1, 1]
    return (rsi - 50) / 50;
  }

  /**
   * Get hashrate feature (normalized)
   */
  _getHashrateFeature(hashrates, timestamp) {
    if (!hashrates || hashrates.length === 0) return 0;
    
    // Find closest hashrate data point
    let closest = hashrates[0];
    let minDiff = Math.abs(hashrates[0].timestamp - timestamp);
    
    for (const h of hashrates) {
      const diff = Math.abs(h.timestamp - timestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closest = h;
      }
    }
    
    // Normalize using min-max scaling
    if (this.stats.hashrate.min !== null && this.stats.hashrate.max !== null) {
      const range = this.stats.hashrate.max - this.stats.hashrate.min;
      if (range === 0) return 0;
      return (closest.hashrate - this.stats.hashrate.min) / range;
    }
    
    return 0;
  }

  /**
   * Get difficulty feature (normalized)
   */
  _getDifficultyFeature(difficulties, timestamp) {
    if (!difficulties || difficulties.length === 0) return 0;
    
    // Find closest difficulty data point
    let closest = difficulties[0];
    let minDiff = Math.abs(difficulties[0].timestamp - timestamp);
    
    for (const d of difficulties) {
      const diff = Math.abs(d.timestamp - timestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closest = d;
      }
    }
    
    // Normalize using min-max scaling
    if (this.stats.difficulty.min !== null && this.stats.difficulty.max !== null) {
      const range = this.stats.difficulty.max - this.stats.difficulty.min;
      if (range === 0) return 0;
      return (closest.difficulty - this.stats.difficulty.min) / range;
    }
    
    return 0;
  }

  /**
   * Compute basic statistics (min, max, mean, std)
   */
  _computeStats(values) {
    if (values.length === 0) {
      return { min: 0, max: 0, mean: 0, std: 1 };
    }
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    
    return { min, max, mean, std: std || 1 }; // Avoid division by zero
  }

  /**
   * Save statistics to disk for later use in production
   */
  async saveStats(filePath = './models/feature-stats.json') {
    const fs = await import('fs/promises');
    await fs.writeFile(filePath, JSON.stringify(this.stats, null, 2));
    console.log(`✅ Feature statistics saved to ${filePath}`);
  }

  /**
   * Load statistics from disk
   */
  async loadStats(filePath = './models/feature-stats.json') {
    const fs = await import('fs/promises');
    const data = await fs.readFile(filePath, 'utf-8');
    this.stats = JSON.parse(data);
    this.statsComputed = true;
    console.log(`✅ Feature statistics loaded from ${filePath}`);
  }

  /**
   * Get the current BTC price
   */
  async getCurrentPrice() {
    const { getLatestPrice } = await import('../db/pricesDb.js');
    const priceRow = getLatestPrice('BTC');
    return priceRow ? priceRow.price : null;
  }

  /**
   * Denormalize a price prediction (convert from percentage change back to price)
   */
  denormalizePrice(normalizedChange) {
    // The model predicts percentage change, so we need current price
    // This should be called with getCurrentPrice() result
    // For now, return the value as-is and handle conversion in the service
    return normalizedChange;
  }
}
