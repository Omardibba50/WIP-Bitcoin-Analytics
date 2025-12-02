/**
 * AI Prediction Service
 * Loads the trained LSTM model and generates Bitcoin price predictions
 */

import * as tf from '@tensorflow/tfjs-node';
import { FeatureStore } from './featureStore.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class AIPredictionService {
  constructor() {
    this.model = null;
    this.featureStore = null;
    this.initialized = false;
    this.modelPath = path.join(__dirname, '../../models/lstm-btc-best/model.json');
  }

  /**
   * Initialize the prediction service by loading the trained model
   */
  async initialize() {
    if (this.initialized) {
      console.log('⚠️  AI Prediction Service already initialized');
      return;
    }

    try {
      console.log('🤖 Initializing AI Prediction Service...');
      
      // Check if model exists
      if (!fs.existsSync(this.modelPath)) {
        throw new Error(`Model not found at ${this.modelPath}. Please train the model first using: node scripts/train-lstm-model.js`);
      }

      // Load the trained model
      console.log('📂 Loading LSTM model...');
      this.model = await tf.loadLayersModel(`file://${this.modelPath}`);
      console.log('✅ Model loaded successfully');

      // Initialize feature store
      this.featureStore = new FeatureStore();
      await this.featureStore.loadStats();
      console.log('✅ Feature store initialized');

      this.initialized = true;
      console.log('🎉 AI Prediction Service ready!\n');
      
      // Print model summary
      console.log('📊 Model Architecture:');
      this.model.summary();
      console.log('');

    } catch (error) {
      console.error('❌ Failed to initialize AI Prediction Service:', error.message);
      throw error;
    }
  }

  /**
   * Generate a price prediction for the specified horizon
   * @param {string} horizon - Prediction horizon ('1h', '24h', '7d')
   * @returns {Object} Prediction object with price, confidence, and metadata
   */
  async predictPrice(horizon = '1h') {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const now = Date.now();
      
      // Compute features for the last 60 timesteps
      console.log(`🔮 Generating ${horizon} prediction...`);
      const features = await this.featureStore.computeFeatures('BTC', now, 60);
      
      if (!features || features.length !== 60) {
        throw new Error(`Expected 60 timesteps, got ${features?.length || 0}`);
      }

      // Convert features to tensor [1, 60, 10]
      const featureArray = features.map(f => [
        f.log_return_1h,
        f.log_return_4h,
        f.log_return_24h,
        f.sma_24h,
        f.volatility_24h,
        f.rsi_14,
        f.hashrate_normalized,
        f.difficulty_normalized,
        f.hour_sin,
        f.day_cos
      ]);

      const inputTensor = tf.tensor3d([featureArray]);

      // Make prediction
      const predictionTensor = this.model.predict(inputTensor);
      const modelOutput = (await predictionTensor.data())[0]; // This is percentage change

      // Get current price
      const currentPrice = await this.featureStore.getCurrentPrice();
      
      if (!currentPrice) {
        throw new Error('Unable to fetch current BTC price');
      }

      // Convert percentage change to actual price
      // Model outputs: (targetPrice - currentPrice) / currentPrice
      const predictedPrice = currentPrice * (1 + modelOutput);

      // Compute confidence based on recent volatility
      // Lower volatility = higher confidence
      const recentVol = features[features.length - 1].volatility_24h;
      const confidence = Math.max(0.1, Math.min(0.95, 1 - (recentVol * 10)));

      // Calculate predicted change
      const predictedChange = predictedPrice - currentPrice;
      const predictedChangePercent = (predictedChange / currentPrice) * 100;

      // Clean up tensors
      tf.dispose([inputTensor, predictionTensor]);

      const prediction = {
        model_id: 'lstm_btc_1h_v1',
        model_type: 'Bidirectional LSTM',
        predicted_price: Math.round(predictedPrice * 100) / 100,
        current_price: Math.round(currentPrice * 100) / 100,
        predicted_change: Math.round(predictedChange * 100) / 100,
        predicted_change_percent: Math.round(predictedChangePercent * 100) / 100,
        confidence: Math.round(confidence * 100) / 100,
        horizon: horizon,
        timestamp: now,
        prediction_for: now + (horizon === '1h' ? 3600000 : horizon === '24h' ? 86400000 : 604800000)
      };

      console.log(`✅ Prediction: $${prediction.predicted_price.toLocaleString()} (${predictedChangePercent > 0 ? '+' : ''}${prediction.predicted_change_percent}%)`);
      console.log(`   Current: $${prediction.current_price.toLocaleString()}`);
      console.log(`   Confidence: ${(confidence * 100).toFixed(1)}%\n`);

      return prediction;

    } catch (error) {
      console.error('❌ Prediction failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate predictions for multiple horizons
   * @returns {Object} Predictions for 1h, 24h, and 7d
   */
  async predictMultipleHorizons() {
    const predictions = {
      '1h': await this.predictPrice('1h'),
      timestamp: Date.now()
    };

    return predictions;
  }

  /**
   * Check if the service is ready
   */
  isReady() {
    return this.initialized && this.model !== null;
  }

  /**
   * Get model information
   */
  getModelInfo() {
    if (!this.initialized) {
      return { status: 'not_initialized' };
    }

    const statsPath = path.join(__dirname, '../../models/feature-stats.json');
    const metadataPath = path.join(__dirname, '../../models/training-metadata.json');

    const stats = fs.existsSync(statsPath) ? JSON.parse(fs.readFileSync(statsPath, 'utf8')) : {};
    const metadata = fs.existsSync(metadataPath) ? JSON.parse(fs.readFileSync(metadataPath, 'utf8')) : {};

    return {
      status: 'ready',
      model: {
        id: 'lstm_btc_1h_v1',
        type: 'Bidirectional LSTM',
        architecture: metadata.hyperparameters?.architecture || 'Unknown',
        trained_at: metadata.trainedAt || 'Unknown',
        training_time: metadata.trainingTime || 'Unknown'
      },
      performance: metadata.performance || {},
      dataset: metadata.dataset || {},
      features: {
        count: 9,
        timesteps: 60,
        normalization: 'min-max and z-score'
      }
    };
  }
}

// Singleton instance
let serviceInstance = null;

/**
 * Get the singleton instance of AI Prediction Service
 */
export function getAIPredictionService() {
  if (!serviceInstance) {
    serviceInstance = new AIPredictionService();
  }
  return serviceInstance;
}
