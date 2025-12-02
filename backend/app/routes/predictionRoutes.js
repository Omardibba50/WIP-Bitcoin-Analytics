import express from 'express';
import { createPrediction, listPredictions, getPredictionHistory, getLatestPrediction } from '../controllers/predictionController.js';

const router = express.Router();

// GET /api/predictions - List predictions for a specific model
router.get('/', listPredictions);

// GET /api/predictions/history - Get prediction history
router.get('/history', getPredictionHistory);

// GET /api/predictions/latest - Get the latest prediction
router.get('/latest', getLatestPrediction);

// POST /api/predictions - Create a new prediction
router.post('/', createPrediction);

export default router;
