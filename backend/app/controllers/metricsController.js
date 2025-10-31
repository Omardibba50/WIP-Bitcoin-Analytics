import { fetchBitcoinSupplyMetrics, fetchGoldMetrics, fetchCorporateTreasuryTotals } from '../services/bitcoinMetricsService.js';
import { getLatestPrice } from '../db/pricesDb.js';

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
