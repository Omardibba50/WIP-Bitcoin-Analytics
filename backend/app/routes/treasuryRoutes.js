import express from 'express';
import { getAll, getTop, getStats } from '../controllers/treasuryController.js';

const router = express.Router();

// GET /api/treasuries
router.get('/', getAll);

// GET /api/treasuries/top
router.get('/top', getTop);

// GET /api/treasuries/stats
router.get('/stats', getStats);

export default router;
