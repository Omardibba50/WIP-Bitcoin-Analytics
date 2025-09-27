import express from 'express';
import { createPrediction, listPredictions } from '../controllers/predictionController.js';

const router = express.Router();

// GET /api/predictions - List predictions for a specific model
router.get('/', listPredictions);

// POST /api/predictions - Create a new prediction
router.post('/', createPrediction);

export default router;
