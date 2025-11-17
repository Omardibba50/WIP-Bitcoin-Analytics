// Service to compute correlations between metrics and BTC price
import { getDb } from '../../db.js';
import { getHistory } from '../db/pricesDb.js';
import { getHashrateHistory } from '../db/hashrateDb.js';
import { getDifficultyHistory } from '../db/difficultyDb.js';

/**
 * Calculate Pearson correlation coefficient between two arrays
 * @param {Array<number>} x - First dataset
 * @param {Array<number>} y - Second dataset
 * @returns {number} Correlation coefficient (-1 to 1)
 */
function calculatePearsonCorrelation(x, y) {
  if (x.length !== y.length || x.length === 0) {
    return 0;
  }

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  
  return numerator / denominator;
}

/**
 * Align two time series datasets by timestamp
 * Returns arrays of values that have matching timestamps
 */
function alignTimeSeries(series1, series2, timeKey1 = 'timestamp', timeKey2 = 'timestamp') {
  const aligned1 = [];
  const aligned2 = [];
  
  // Create a map of series2 by timestamp for faster lookup
  const series2Map = new Map();
  series2.forEach(item => {
    const ts = item[timeKey2];
    series2Map.set(ts, item);
  });
  
  // Find matching timestamps
  series1.forEach(item1 => {
    const ts = item1[timeKey1];
    const item2 = series2Map.get(ts);
    
    if (item2) {
      aligned1.push(item1);
      aligned2.push(item2);
    }
  });
  
  return { aligned1, aligned2 };
}

/**
 * Get timespan in days
 */
function getTimespanDays(timespan) {
  const timespans = {
    '30d': 30,
    '90d': 90,
    '1y': 365,
    '2y': 730
  };
  return timespans[timespan] || 30;
}

/**
 * Calculate correlation between hashrate and BTC price
 */
export async function calculateHashratePriceCorrelation(timespan = '30d') {
  try {
    const days = getTimespanDays(timespan);
    const to = Date.now();
    const from = to - (days * 24 * 60 * 60 * 1000);
    
    // Fetch data
    const priceData = getHistory('BTC', from, to, 10000);
    const hashrateData = getHashrateHistory(from, to, 10000);
    
    if (priceData.length === 0 || hashrateData.length === 0) {
      return null;
    }
    
    // Align time series
    const { aligned1: prices, aligned2: hashrates } = alignTimeSeries(
      priceData, 
      hashrateData, 
      'ts', 
      'timestamp'
    );
    
    if (prices.length < 10) {
      return null;
    }
    
    // Extract values
    const priceValues = prices.map(p => p.price);
    const hashrateValues = hashrates.map(h => h.hashrate_ths);
    
    // Calculate correlation
    const correlation = calculatePearsonCorrelation(priceValues, hashrateValues);
    
    return {
      metric: 'hashrate',
      correlation: correlation,
      dataPoints: prices.length,
      timespan: timespan
    };
  } catch (error) {
    console.error('Error calculating hashrate-price correlation:', error);
    return null;
  }
}

/**
 * Calculate correlation between difficulty and BTC price
 */
export async function calculateDifficultyPriceCorrelation(timespan = '30d') {
  try {
    const days = getTimespanDays(timespan);
    const to = Date.now();
    const from = to - (days * 24 * 60 * 60 * 1000);
    
    // Fetch data
    const priceData = getHistory('BTC', from, to, 10000);
    const difficultyData = getDifficultyHistory(from, to, 10000);
    
    if (priceData.length === 0 || difficultyData.length === 0) {
      return null;
    }
    
    // Align time series
    const { aligned1: prices, aligned2: difficulties } = alignTimeSeries(
      priceData, 
      difficultyData, 
      'ts', 
      'timestamp'
    );
    
    if (prices.length < 10) {
      return null;
    }
    
    // Extract values
    const priceValues = prices.map(p => p.price);
    const difficultyValues = difficulties.map(d => d.difficulty);
    
    // Calculate correlation
    const correlation = calculatePearsonCorrelation(priceValues, difficultyValues);
    
    return {
      metric: 'difficulty',
      correlation: correlation,
      dataPoints: prices.length,
      timespan: timespan
    };
  } catch (error) {
    console.error('Error calculating difficulty-price correlation:', error);
    return null;
  }
}

/**
 * Calculate all correlations and cache in database
 */
export async function calculateAllCorrelations(timespan = '30d') {
  try {
    console.log(`📊 Calculating correlations for timespan: ${timespan}`);
    
    const correlations = [];
    
    // Calculate hashrate correlation
    const hashrateCorr = await calculateHashratePriceCorrelation(timespan);
    if (hashrateCorr) {
      correlations.push(hashrateCorr);
      saveCorrelation('hashrate', hashrateCorr.correlation, timespan);
    }
    
    // Calculate difficulty correlation
    const difficultyCorr = await calculateDifficultyPriceCorrelation(timespan);
    if (difficultyCorr) {
      correlations.push(difficultyCorr);
      saveCorrelation('difficulty', difficultyCorr.correlation, timespan);
    }
    
    console.log(`✅ Calculated ${correlations.length} correlations`);
    
    return correlations;
  } catch (error) {
    console.error('Error calculating all correlations:', error);
    return [];
  }
}

/**
 * Save correlation to database
 */
function saveCorrelation(metricName, correlationCoefficient, timespan) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO metric_correlations (metric_name, correlation_coefficient, timespan, calculated_at)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(metricName, correlationCoefficient, timespan, Date.now());
}

/**
 * Get latest correlations from database
 */
export function getLatestCorrelations(timespan = '30d', limit = 10) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT metric_name, correlation_coefficient, timespan, calculated_at
    FROM metric_correlations
    WHERE timespan = ?
    ORDER BY calculated_at DESC
    LIMIT ?
  `);
  return stmt.all(timespan, limit);
}

/**
 * Get top correlated metrics
 */
export function getTopCorrelations(timespan = '30d', limit = 5) {
  const db = getDb();
  
  // Get latest calculation time
  const latestStmt = db.prepare(`
    SELECT MAX(calculated_at) as latest
    FROM metric_correlations
    WHERE timespan = ?
  `);
  const latestRow = latestStmt.get(timespan);
  
  if (!latestRow || !latestRow.latest) {
    return [];
  }
  
  // Get correlations from that calculation
  const stmt = db.prepare(`
    SELECT metric_name, correlation_coefficient, timespan, calculated_at
    FROM metric_correlations
    WHERE timespan = ? AND calculated_at = ?
    ORDER BY ABS(correlation_coefficient) DESC
    LIMIT ?
  `);
  return stmt.all(timespan, latestRow.latest, limit);
}
