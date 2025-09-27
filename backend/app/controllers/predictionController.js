// Handles prediction-related logic
import { insertPrediction, getPredictionsByModel } from '../db/predictionsDb.js';
import { predictEma } from '../services/emaModel.js';

export function createPrediction(req, res) {
  try {
    const { modelId, symbol, predictedPrice, confidence, horizon } = req.body;
    if (!modelId || !symbol || predictedPrice == null) {
      return res.status(400).json({ error: 'Missing required fields: modelId, symbol, predictedPrice' });
    }
    insertPrediction(modelId, symbol, predictedPrice, confidence, horizon);
    res.status(201).json({ message: 'Prediction created successfully' });
  } catch (err) {
    console.error('Error creating prediction:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function listPredictions(req, res) {
  try {
    const { modelId, symbol } = req.query;
    if (!modelId) {
      return res.status(400).json({ error: 'Missing required query parameter: modelId' });
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
    res.json({ data: predictions });
  } catch (err) {
    console.error('Error listing predictions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
