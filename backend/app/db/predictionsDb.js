import { getDb } from '../../db.js';

export function insertPrediction(modelId, symbol, predictedPrice, confidence, horizon, ts = Date.now()) {
  const d = getDb();
  const stmt = d.prepare('INSERT INTO predictions(model_id, symbol, predicted_price, confidence, horizon, ts) VALUES (?, ?, ?, ?, ?, ?)');
  return stmt.run(modelId, symbol, predictedPrice, confidence, horizon, ts);
}

export function getPredictionsByModel(modelId) {
  const d = getDb();
  return d.prepare('SELECT * FROM predictions WHERE model_id = ?').all(modelId);
}
