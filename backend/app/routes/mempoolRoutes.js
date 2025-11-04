import express from 'express';
import { getMempoolStats } from '../controllers/mempoolController.js';

const router = express.Router();

// GET /api/mempool/stats - Get current mempool statistics and next block prediction
router.get('/stats', getMempoolStats);

export default router;
