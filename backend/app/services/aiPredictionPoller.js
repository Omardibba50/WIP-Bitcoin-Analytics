/**
 * AI Prediction Poller
 * Automatically generates Bitcoin price predictions every hour
 */

import { getAIPredictionService } from './aiPredictionService.js';
import { insertPrediction } from '../db/predictionsDb.js';

const POLL_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours (production optimized)
let pollingInterval = null;
let predictionService = null;

/**
 * Start the AI prediction polling service
 */
export async function startAIPredictionPolling() {
  try {
    console.log('🔄 Starting AI prediction polling service...');
    
    // Get the singleton service instance
    predictionService = getAIPredictionService();
    
    // Initialize the service (loads model)
    await predictionService.initialize();
    
    // Ensure model is registered in database
    await ensureModelExists();
    
    // Generate first prediction immediately
    await generateAndStorePrediction();
    
    // Then generate predictions every hour
    pollingInterval = setInterval(async () => {
      await generateAndStorePrediction();
    }, POLL_INTERVAL);
    
    console.log('✅ AI prediction polling started (every 2 hours)\n');
    
  } catch (error) {
    console.error('❌ Failed to start AI prediction polling:', error.message);
    console.error('   The service will retry on next server restart.');
  }
}

/**
 * Ensure the AI model is registered in the models table
 */
async function ensureModelExists() {
  const { getDb } = await import('../../db.js');
  const db = getDb();
  
  const modelId = 'lstm_btc_1h_v1';
  const existing = db.prepare('SELECT * FROM models WHERE id = ?').get(modelId);
  
  if (!existing) {
    console.log('📝 Registering AI model in database...');
    db.prepare(`
      INSERT INTO models (id, name, description, version, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      modelId,
      'LSTM Bitcoin Price Predictor',
      'Bidirectional LSTM model for 1-hour BTC price predictions',
      'v1.0',
      Date.now()
    );
    console.log('✅ Model registered');
  }
}

/**
 * Stop the prediction polling service
 */
export function stopAIPredictionPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('⏹️  AI prediction polling stopped');
  }
}

/**
 * Generate a prediction and store it in the database
 */
async function generateAndStorePrediction() {
  try {
    const startTime = Date.now();
    
    // Generate 1-hour prediction
    const prediction = await predictionService.predictPrice('1h');
    
    // Store in database
    await insertPrediction(
      prediction.model_id,
      'BTC',
      prediction.predicted_price,
      prediction.confidence,
      prediction.horizon,
      prediction.timestamp
    );
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`[${new Date().toISOString()}] 💾 AI Prediction stored`);
    console.log(`   Price: $${prediction.predicted_price.toLocaleString()} (${prediction.predicted_change_percent > 0 ? '+' : ''}${prediction.predicted_change_percent}%)`);
    console.log(`   Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
    console.log(`   Time: ${elapsed}s\n`);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ AI prediction generation failed:`, error.message);
  }
}

/**
 * Generate a prediction on-demand (for API calls)
 */
export async function generatePredictionOnDemand() {
  if (!predictionService) {
    predictionService = getAIPredictionService();
    await predictionService.initialize();
  }
  
  return await predictionService.predictPrice('1h');
}

/**
 * Get model information
 */
export function getModelInfo() {
  if (!predictionService) {
    return { status: 'not_initialized' };
  }
  return predictionService.getModelInfo();
}
