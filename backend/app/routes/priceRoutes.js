// Price routes

import express from 'express';
import { getLatestPrice, getHistory, getAllTimeHigh } from '../controllers/priceController.js';
import { getPriceSummary } from '../controllers/summaryController.js';

const router = express.Router();

// GET /api/prices/latest
router.get('/latest', getLatestPrice);

// GET /api/prices/history
router.get('/history', getHistory);

// GET /api/prices/summary
router.get('/summary', getPriceSummary);

// GET /api/prices/ath (all-time high)
router.get('/ath', getAllTimeHigh);

export default router;
