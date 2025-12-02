import express from 'express';
import { 
  getSupplyMetrics, 
  getGoldMetrics, 
  getTreasuryTotals, 
  getAllMetrics,
  getHashrateHistoryWithPrice,
  getDifficultyHistoryWithPrice,
  getCorrelations,
  getMetricsOverview,
  getStockToFlowData
} from '../controllers/metricsController.js';

const router = express.Router();

// GET /api/metrics/overview - Dashboard metrics overview
router.get('/overview', getMetricsOverview);

// GET /api/metrics/supply
router.get('/supply', getSupplyMetrics);

// GET /api/metrics/gold
router.get('/gold', getGoldMetrics);

// GET /api/metrics/treasury-totals
router.get('/treasury-totals', getTreasuryTotals);

// GET /api/metrics/all
router.get('/all', getAllMetrics);

// GET /api/metrics/hashrate - Get hashrate data (with optional date range)
router.get('/hashrate', getHashrateHistoryWithPrice);

// GET /api/metrics/hashrate/history - Get historical hashrate with price
router.get('/hashrate/history', getHashrateHistoryWithPrice);

// GET /api/metrics/difficulty/history - Get historical difficulty with price
router.get('/difficulty/history', getDifficultyHistoryWithPrice);

// GET /api/metrics/correlations - Get metric correlations
router.get('/correlations', getCorrelations);

// GET /api/metrics/stock-to-flow - Get stock-to-flow data
router.get('/stock-to-flow', getStockToFlowData);

export default router;
