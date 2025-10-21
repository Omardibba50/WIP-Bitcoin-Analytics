import express from 'express';
import { getLatest, getByHeight, getStats } from '../controllers/blockController.js';

const router = express.Router();

// GET /api/blocks/latest
router.get('/latest', getLatest);

// GET /api/blocks/stats
router.get('/stats', getStats);

// GET /api/blocks/:height
router.get('/:height', getByHeight);

export default router;
