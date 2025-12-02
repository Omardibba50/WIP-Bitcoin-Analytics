// Handles prediction-related logic
import { insertPrediction, getPredictionsByModel } from '../db/predictionsDb.js';
import { predictEma } from '../services/emaModel.js';
import { getLatestPrice } from '../db/pricesDb.js';
import { success, failure } from '../utils/responseHelpers.js';

export function createPrediction(req, res) {
  try {
    const { modelId, symbol, predictedPrice, confidence, horizon } = req.body;
    if (!modelId || !symbol || predictedPrice == null) {
      return res.status(400).json(failure('Missing required fields: modelId, symbol, predictedPrice', 400));
    }
    insertPrediction(modelId, symbol, predictedPrice, confidence, horizon);
    res.status(201).json(success({ message: 'Prediction created successfully' }));
  } catch (err) {
    console.error('Error creating prediction:', err);
    res.status(500).json(failure('Internal server error', 500));
  }
}

export function listPredictions(req, res) {
  try {
    const { modelId, symbol } = req.query;
    if (!modelId) {
      return res.status(400).json(failure('Missing required query parameter: modelId', 400));
    }

    // If EMA model requested, compute a fresh prediction on-demand and store it
    if (modelId.startsWith('ema')) {
      const period = Number(modelId.split('_')[1]?.replace('h', '')) || 24;
      const sym = (symbol || 'BTC').toUpperCase();
      const pred = predictEma({ symbol: sym, period, horizon: '1h' });
      if (pred && pred.predicted_price != null) {
        try {
          insertPrediction(pred.model_id, pred.symbol, pred.predicted_price, pred.confidence, pred.horizon);
        } catch (_) { /* best-effort */ }
      }
    }

    const predictions = getPredictionsByModel(modelId);
  res.json(success(predictions));
  } catch (err) {
    console.error('Error listing predictions:', err);
  res.status(500).json(failure('Internal server error', 500));
  }
}

export function getPredictionHistory(req, res) {
  try {
    const { modelId, symbol, limit = 100 } = req.query;
    
    // For now, return the same as listPredictions
    // This can be expanded to support historical prediction tracking
    if (modelId) {
      const predictions = getPredictionsByModel(modelId);
      const limited = predictions.slice(0, parseInt(limit));
  return res.json(success(limited));
    }
    
    // If no modelId, return empty array (could be expanded to return all predictions)
  res.json(success([]));
  } catch (err) {
    console.error('Error getting prediction history:', err);
  res.status(500).json(failure('Internal server error', 500));
  }
}

// GET /api/predictions/latest - Return latest prediction across known models
export function getLatestPrediction(req, res) {
  try {
    // For MVP: pick most recent from a default model (ema_24h)
    const defaultModel = 'ema_24h';
    const preds = getPredictionsByModel(defaultModel);
    const latest = preds && preds.length ? preds[preds.length - 1] : null;

    // Include current price for context
    const priceRow = getLatestPrice('BTC');
    const price = priceRow?.price ?? null;

    if (!latest) {
      return res.json(success({ prediction: null, price }));
    }
    res.json(success({ prediction: { ...latest }, price }));
  } catch (err) {
    console.error('Error getting latest prediction:', err);
    res.status(500).json(failure('Internal server error', 500));
  }
}

