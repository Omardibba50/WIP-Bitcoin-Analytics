import { fetchBitcoinSupplyMetrics, fetchGoldMetrics, fetchCorporateTreasuryTotals } from '../services/bitcoinMetricsService.js';
import { getLatestPrice, getHistory } from '../db/pricesDb.js';
import { getHashrateHistory } from '../db/hashrateDb.js';
import { getDifficultyHistory } from '../db/difficultyDb.js';
import { calculateAllCorrelations, getTopCorrelations } from '../services/correlationService.js';

export async function getSupplyMetrics(req, res) {
  try {
    const metrics = await fetchBitcoinSupplyMetrics();
    
    if (!metrics) {
      return res.status(500).json({ error: 'Failed to fetch supply metrics' });
    }
    
    res.json({ data: metrics });
  } catch (error) {
    console.error('Error in getSupplyMetrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getGoldMetrics(req, res) {
  try {
    // Get current BTC price from database
    const priceData = getLatestPrice('BTC');
    
    if (!priceData || !priceData.price) {
      return res.status(503).json({ error: 'BTC price data not available' });
    }
    
    const btcPrice = priceData.price;
    
    const metrics = await fetchGoldMetrics(btcPrice);
    
    if (!metrics) {
      return res.status(500).json({ error: 'Failed to fetch gold metrics' });
    }
    
    res.json({ data: metrics });
  } catch (error) {
    console.error('Error in getGoldMetrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getTreasuryTotals(req, res) {
  try {
    // Get current BTC price from database
    const priceData = getLatestPrice('BTC');
    
    if (!priceData || !priceData.price) {
      return res.status(503).json({ error: 'BTC price data not available' });
    }
    
    const btcPrice = priceData.price;
    
    const metrics = await fetchCorporateTreasuryTotals(btcPrice);
    
    if (!metrics) {
      return res.status(500).json({ error: 'Failed to fetch treasury totals' });
    }
    
    res.json({ data: metrics });
  } catch (error) {
    console.error('Error in getTreasuryTotals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAllMetrics(req, res) {
  try {
    // Get current BTC price from database
    const priceData = getLatestPrice('BTC');
    
    if (!priceData || !priceData.price) {
      return res.status(503).json({ error: 'BTC price data not available' });
    }
    
    const btcPrice = priceData.price;
    
    // Fetch all metrics
    const [supply, gold, treasury] = await Promise.all([
      fetchBitcoinSupplyMetrics(),
      fetchGoldMetrics(btcPrice),
      fetchCorporateTreasuryTotals(btcPrice)
    ]);
    
    res.json({
      data: {
        supply,
        gold,
        treasury,
        btcPrice
      }
    });
  } catch (error) {
    console.error('Error in getAllMetrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getHashrateHistoryWithPrice(req, res) {
  try {
    const timespan = req.query.timespan || '30d';
    
    // Calculate days from timespan
    const timespanMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
      'all': 3650 // ~10 years
    };
    
    const days = timespanMap[timespan] || 30;
    const to = Date.now();
    const from = to - (days * 24 * 60 * 60 * 1000);
    
    // Fetch hashrate and price data
    const hashrateData = getHashrateHistory(from, to, 10000);
    const priceData = getHistory('BTC', from, to, 10000);
    
    // Combine data - align by timestamp
    const combined = hashrateData.map(h => {
      // Find closest price point
      const closestPrice = priceData.reduce((prev, curr) => {
        return Math.abs(curr.ts - h.timestamp) < Math.abs(prev.ts - h.timestamp) ? curr : prev;
      }, priceData[0]);
      
      return {
        timestamp: h.timestamp,
        hashrate: h.hashrate_ths,
        price: closestPrice ? closestPrice.price : null
      };
    });
    
    res.json({ data: combined });
  } catch (error) {
    console.error('Error in getHashrateHistoryWithPrice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getDifficultyHistoryWithPrice(req, res) {
  try {
    const timespan = req.query.timespan || '30d';
    
    // Calculate days from timespan
    const timespanMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
      'all': 3650 // ~10 years
    };
    
    const days = timespanMap[timespan] || 30;
    const to = Date.now();
    const from = to - (days * 24 * 60 * 60 * 1000);
    
    // Fetch difficulty and price data
    const difficultyData = getDifficultyHistory(from, to, 10000);
    const priceData = getHistory('BTC', from, to, 10000);
    
    // Combine data - align by timestamp
    const combined = difficultyData.map(d => {
      // Find closest price point
      const closestPrice = priceData.reduce((prev, curr) => {
        return Math.abs(curr.ts - d.timestamp) < Math.abs(prev.ts - d.timestamp) ? curr : prev;
      }, priceData[0]);
      
      return {
        timestamp: d.timestamp,
        difficulty: d.difficulty,
        adjustment_pct: d.adjustment_pct,
        block_height: d.block_height,
        price: closestPrice ? closestPrice.price : null
      };
    });
    
    res.json({ data: combined });
  } catch (error) {
    console.error('Error in getDifficultyHistoryWithPrice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getCorrelations(req, res) {
  try {
    const timespan = req.query.timespan || '30d';
    const forceRecalculate = req.query.recalculate === 'true';
    
    let correlations;
    
    if (forceRecalculate) {
      // Calculate fresh correlations
      correlations = await calculateAllCorrelations(timespan);
    } else {
      // Get from cache
      correlations = getTopCorrelations(timespan, 10);
      
      // If no cached data, calculate
      if (correlations.length === 0) {
        correlations = await calculateAllCorrelations(timespan);
      }
    }
    
    res.json({ data: correlations });
  } catch (error) {
    console.error('Error in getCorrelations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

