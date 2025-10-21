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
    // Get current BTC price
    const priceData = getLatestPrice('BTC');
    let btcPrice = 67000; // Default fallback
    
    if (priceData && priceData.price) {
      btcPrice = priceData.price;
    } else {
      // Try to fetch fresh price
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        if (response.ok) {
          const data = await response.json();
          btcPrice = data.bitcoin?.usd || btcPrice;
        }
      } catch (err) {
        console.error('Failed to fetch BTC price:', err);
      }
    }
    
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
    // Get current BTC price
    const priceData = getLatestPrice('BTC');
    let btcPrice = 67000; // Default fallback
    
    if (priceData && priceData.price) {
      btcPrice = priceData.price;
    } else {
      // Try to fetch fresh price
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        if (response.ok) {
          const data = await response.json();
          btcPrice = data.bitcoin?.usd || btcPrice;
        }
      } catch (err) {
        console.error('Failed to fetch BTC price:', err);
      }
    }
    
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
    // Get current BTC price
    const priceData = getLatestPrice('BTC');
    let btcPrice = 67000;
    
    if (priceData && priceData.price) {
      btcPrice = priceData.price;
    }
    
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
