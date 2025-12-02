/**
 * AI Prediction API Routes
 * Endpoints for accessing Bitcoin price predictions from the LSTM model
 */

import express from 'express';
import { getAIPredictionService } from '../services/aiPredictionService.js';
import { generatePredictionOnDemand, getModelInfo } from '../services/aiPredictionPoller.js';
import { getDb } from '../../db.js';

const router = express.Router();

/**
 * GET /api/ai/predictions/latest
 * Get the most recent AI prediction
 */
router.get('/latest', async (req, res) => {
  try {
    const db = getDb();
    const prediction = db.prepare(`
      SELECT * FROM predictions 
      WHERE model_id LIKE 'lstm%' 
      ORDER BY ts DESC 
      LIMIT 1
    `).get();

    if (!prediction) {
      return res.status(404).json({
        error: 'No predictions found',
        message: 'The AI model has not generated any predictions yet. Please wait for the hourly prediction cycle.'
      });
    }

    // Get current price for comparison
    const currentPriceRow = db.prepare(`
      SELECT price FROM prices 
      WHERE symbol = 'BTC' 
      ORDER BY ts DESC 
      LIMIT 1
    `).get();

    const currentPrice = currentPriceRow?.price || null;
    const actualChange = currentPrice ? prediction.predicted_price - currentPrice : null;
    const actualChangePercent = currentPrice ? ((actualChange / currentPrice) * 100) : null;

    res.json({
      prediction: {
        ...prediction,
        current_price: currentPrice,
        actual_change: actualChange ? Math.round(actualChange * 100) / 100 : null,
        actual_change_percent: actualChangePercent ? Math.round(actualChangePercent * 100) / 100 : null,
        predicted_at: new Date(prediction.ts).toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching latest prediction:', error);
    res.status(500).json({ error: 'Failed to fetch prediction', message: error.message });
  }
});

/**
 * GET /api/ai/predictions/history
 * Get historical predictions
 */
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const db = getDb();
    const predictions = db.prepare(`
      SELECT * FROM predictions 
      WHERE model_id LIKE 'lstm%' 
      ORDER BY ts DESC 
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM predictions 
      WHERE model_id LIKE 'lstm%'
    `).get().count;

    res.json({
      predictions: predictions.map(p => ({
        ...p,
        predicted_at: new Date(p.ts).toISOString()
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: (offset + limit) < total
      }
    });

  } catch (error) {
    console.error('Error fetching prediction history:', error);
    res.status(500).json({ error: 'Failed to fetch predictions', message: error.message });
  }
});

/**
 * GET /api/ai/predictions/generate
 * Generate a new prediction on-demand
 */
router.get('/generate', async (req, res) => {
  try {
    const prediction = await generatePredictionOnDemand();
    
    res.json({
      prediction: {
        ...prediction,
        predicted_at: new Date(prediction.timestamp).toISOString()
      },
      note: 'This is an on-demand prediction. Scheduled predictions are generated hourly.'
    });

  } catch (error) {
    console.error('Error generating prediction:', error);
    res.status(500).json({ 
      error: 'Failed to generate prediction', 
      message: error.message,
      hint: 'Make sure the model has been trained. Run: node scripts/train-lstm-model.js'
    });
  }
});

/**
 * GET /api/ai/model/info
 * Get information about the AI model
 */
router.get('/model/info', (req, res) => {
  try {
    const info = getModelInfo();
    res.json(info);
  } catch (error) {
    console.error('Error fetching model info:', error);
    res.status(500).json({ error: 'Failed to fetch model info', message: error.message });
  }
});

/**
 * GET /api/ai/model/metrics
 * Get model performance metrics
 */
router.get('/model/metrics', (req, res) => {
  try {
    const info = getModelInfo();
    
    if (info.status !== 'ready') {
      return res.status(503).json({ 
        error: 'Model not initialized',
        message: 'The AI model is not ready yet. Please wait for initialization.'
      });
    }

    res.json({
      model: info.model,
      performance: info.performance,
      dataset: info.dataset,
      features: info.features,
      evaluation: {
        test_mae: info.performance?.testMAE,
        test_loss: info.performance?.testLoss,
        directional_accuracy: info.performance?.directionalAccuracy,
        directional_accuracy_label: 
          info.performance?.directionalAccuracy > 60 ? 'Good' :
          info.performance?.directionalAccuracy > 55 ? 'Fair' :
          info.performance?.directionalAccuracy > 50 ? 'Baseline' : 'Poor'
      }
    });

  } catch (error) {
    console.error('Error fetching model metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics', message: error.message });
  }
});

/**
 * GET /api/ai/status
 * Get the status of the AI prediction service
 */
router.get('/status', (req, res) => {
  try {
    const service = getAIPredictionService();
    const isReady = service.isReady();

    const db = getDb();
    const predictionCount = db.prepare(`
      SELECT COUNT(*) as count FROM predictions 
      WHERE model_id LIKE 'lstm%'
    `).get().count;

    const latestPrediction = db.prepare(`
      SELECT ts FROM predictions 
      WHERE model_id LIKE 'lstm%' 
      ORDER BY ts DESC 
      LIMIT 1
    `).get();

    res.json({
      status: isReady ? 'operational' : 'initializing',
      service: {
        initialized: isReady,
        model_loaded: isReady,
        feature_store_ready: isReady
      },
      predictions: {
        total: predictionCount,
        latest: latestPrediction ? new Date(latestPrediction.ts).toISOString() : null
      },
      polling: {
        interval: '1 hour',
        next_prediction: latestPrediction ? 
          new Date(latestPrediction.ts + (60 * 60 * 1000)).toISOString() : 
          'pending'
      }
    });

  } catch (error) {
    console.error('Error fetching AI status:', error);
    res.status(500).json({ error: 'Failed to fetch status', message: error.message });
  }
});

export default router;
