import express from 'express';
import { fetchLightningNetworkStats, calculateLightningMetrics } from '../services/lightningNetworkService.js';
import { getLatestPrice } from '../db/pricesDb.js';

const router = express.Router();

/**
 * GET /api/lightning/stats
 * Get Lightning Network statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await fetchLightningNetworkStats();
    
    if (!stats) {
      return res.status(503).json({ error: 'Lightning Network data not available' });
    }

    // Get BTC price for USD calculations
    const priceData = getLatestPrice('BTC');
    if (priceData && priceData.price) {
      const enrichedStats = calculateLightningMetrics(stats, priceData.price);
      return res.json({ data: enrichedStats });
    }

    // Return without USD values if price not available
    res.json({ data: stats });
  } catch (error) {
    console.error('Error fetching Lightning Network stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
