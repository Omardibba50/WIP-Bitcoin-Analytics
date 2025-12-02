import express from 'express';
import { 
  getMiningEconomics, 
  getHashrateHistory, 
  getMiningPools 
} from '../controllers/miningController.js';
import { getDifficultyHistoryWithPrice } from '../controllers/metricsController.js';

const router = express.Router();

// GET /api/mining/economics - Get current mining economics data
router.get('/economics', getMiningEconomics);

// GET /api/mining/hashrate/history - Get historical hashrate data
router.get('/hashrate/history', getHashrateHistory);

// GET /api/mining/difficulty/history - Historical difficulty (with price context)
router.get('/difficulty/history', getDifficultyHistoryWithPrice);

// GET /api/mining/pools - Get mining pool distribution
router.get('/pools', getMiningPools);

export default router;
