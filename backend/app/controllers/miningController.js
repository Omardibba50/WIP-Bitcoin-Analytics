import { 
  fetchMiningEconomics, 
  fetchHashrateHistory, 
  fetchMiningPoolDistribution 
} from '../services/miningEconomicsService.js';
import { getLatestPrice } from '../db/pricesDb.js';

/**
 * GET /api/mining/economics
 * Fetch current mining economics data
 */
export async function getMiningEconomics(req, res) {
  try {
    // Get current BTC price from database
    const priceData = getLatestPrice('BTC');
    
    if (!priceData || !priceData.price) {
      return res.status(503).json({ error: 'BTC price data not available' });
    }
    
    const btcPrice = priceData.price;
    
    // Fetch mining economics
    const economics = await fetchMiningEconomics(btcPrice);
    
    if (!economics) {
      return res.status(500).json({ error: 'Failed to fetch mining economics' });
    }
    
    res.json({ data: economics });
  } catch (error) {
    console.error('Error in getMiningEconomics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/mining/hashrate/history
 * Fetch historical hashrate data
 */
export async function getHashrateHistory(req, res) {
  try {
    const timespan = req.query.timespan || '30days';
    
    // Validate timespan
    const validTimespans = ['1days', '7days', '30days', '60days', '180days', '1year', '2years', '3years'];
    if (!validTimespans.includes(timespan)) {
      return res.status(400).json({ error: 'Invalid timespan parameter' });
    }
    
    const history = await fetchHashrateHistory(timespan);
    
    res.json({ data: history });
  } catch (error) {
    console.error('Error in getHashrateHistory:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/mining/pools
 * Fetch mining pool distribution
 */
export async function getMiningPools(req, res) {
  try {
    const pools = await fetchMiningPoolDistribution();
    
    res.json({ data: pools });
  } catch (error) {
    console.error('Error in getMiningPools:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
