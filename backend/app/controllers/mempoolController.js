import { fetchMempoolStats } from '../services/mempoolService.js';
import { getLatestPrice } from '../db/pricesDb.js';

/**
 * GET /api/mempool/stats
 * Fetch current mempool statistics and next block prediction
 */
export async function getMempoolStats(req, res) {
  try {
    const mempoolData = await fetchMempoolStats();
    
    if (!mempoolData) {
      return res.status(500).json({ error: 'Failed to fetch mempool data' });
    }

    // Get current BTC price for USD values
    const priceData = getLatestPrice('BTC');
    const btcPrice = priceData?.price || 0;

    // Add USD values
    const result = {
      ...mempoolData,
      totalFeesUSD: mempoolData.totalFees * btcPrice,
      nextBlock: {
        ...mempoolData.nextBlock,
        totalFeesUSD: mempoolData.nextBlock.totalFees * btcPrice
      }
    };

    res.json({ data: result });
  } catch (error) {
    console.error('Error in getMempoolStats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
