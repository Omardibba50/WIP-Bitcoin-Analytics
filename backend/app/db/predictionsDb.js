import { getDb } from '../../db.js';

export function insertPrediction(modelId, symbol, predictedPrice, confidence, horizon, ts = Date.now(), predictedForTs = null) {
  const d = getDb();
  
  // Calculate predicted_for_ts if not provided
  if (!predictedForTs) {
    const horizonMs = {
      '1h': 3600000,
      '24h': 86400000,
      '7d': 604800000
    };
    predictedForTs = ts + (horizonMs[horizon] || 3600000);
  }
  
  // Try to insert with predicted_for_ts, fallback to old schema if column doesn't exist
  try {
    const stmt = d.prepare('INSERT INTO predictions(model_id, symbol, predicted_price, confidence, horizon, ts, predicted_for_ts) VALUES (?, ?, ?, ?, ?, ?, ?)');
    return stmt.run(modelId, symbol, predictedPrice, confidence, horizon, ts, predictedForTs);
  } catch (err) {
    // If column doesn't exist yet (pre-migration), use old schema
    if (err.message.includes('no column named predicted_for_ts')) {
      console.warn('⚠️  predicted_for_ts column not found. Run migration: node backend/migrations/run-migration.js');
      const stmt = d.prepare('INSERT INTO predictions(model_id, symbol, predicted_price, confidence, horizon, ts) VALUES (?, ?, ?, ?, ?, ?)');
      return stmt.run(modelId, symbol, predictedPrice, confidence, horizon, ts);
    }
    throw err;
  }
}

export function getPredictionsByModel(modelId) {
  const d = getDb();
  return d.prepare('SELECT * FROM predictions WHERE model_id = ?').all(modelId);
}
