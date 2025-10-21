import express from 'express';
import { getSupplyMetrics, getGoldMetrics, getTreasuryTotals, getAllMetrics } from '../controllers/metricsController.js';

const router = express.Router();

// GET /api/metrics/supply
router.get('/supply', getSupplyMetrics);

// GET /api/metrics/gold
router.get('/gold', getGoldMetrics);

// GET /api/metrics/treasury-totals
router.get('/treasury-totals', getTreasuryTotals);

// GET /api/metrics/all
router.get('/all', getAllMetrics);

export default router;
