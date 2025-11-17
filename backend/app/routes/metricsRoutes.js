import express from 'express';
import { 
  getSupplyMetrics, 
  getGoldMetrics, 
  getTreasuryTotals, 
  getAllMetrics,
  getHashrateHistoryWithPrice,
  getDifficultyHistoryWithPrice,
  getCorrelations
} from '../controllers/metricsController.js';

const router = express.Router();

// GET /api/metrics/supply
router.get('/supply', getSupplyMetrics);

// GET /api/metrics/gold
router.get('/gold', getGoldMetrics);

// GET /api/metrics/treasury-totals
router.get('/treasury-totals', getTreasuryTotals);

// GET /api/metrics/all
router.get('/all', getAllMetrics);

// GET /api/metrics/hashrate/history - Get historical hashrate with price
router.get('/hashrate/history', getHashrateHistoryWithPrice);

// GET /api/metrics/difficulty/history - Get historical difficulty with price
router.get('/difficulty/history', getDifficultyHistoryWithPrice);

// GET /api/metrics/correlations - Get metric correlations
router.get('/correlations', getCorrelations);

export default router;
