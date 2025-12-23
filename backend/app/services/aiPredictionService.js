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

      // Calculate price range based on volatility (uncertainty band)
      // Use recent volatility to create a confidence interval
      const volatilityMultiplier = recentVol * 2; // 2 standard deviations
      const priceRange = currentPrice * volatilityMultiplier;
      const predictedLow = Math.max(0, predictedPrice - priceRange);
      const predictedHigh = predictedPrice + priceRange;

      // Clean up tensors
      tf.dispose([inputTensor, predictionTensor]);

      const prediction = {
        model_id: 'lstm_btc_1h_v1',
        model_type: 'Bidirectional LSTM',
        predicted_price: Math.round(predictedPrice * 100) / 100,
        predicted_low: Math.round(predictedLow * 100) / 100,
        predicted_high: Math.round(predictedHigh * 100) / 100,
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
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log('🔮 Generating multi-horizon predictions...');
      
      // Generate base 1h prediction (model-based)
      const pred1h = await this.predictPrice('1h');
      
      // For 24h and 7d, use volatility-based extrapolation
      // This is honest: we label them as extrapolated, not pure model predictions
      const currentPrice = pred1h.current_price;
      const features = await this.featureStore.computeFeatures('BTC', Date.now(), 60);
      const latestFeatures = features[features.length - 1];
      const recentVol = latestFeatures.volatility_24h;
      
      // Extract technical indicators for context
      const rsi = latestFeatures.rsi_14;
      const sma24h = latestFeatures.sma_24h;
      
      // Determine RSI state
      let rsiState = 'neutral';
      if (rsi > 70) rsiState = 'overbought';
      else if (rsi < 30) rsiState = 'oversold';
      
      // Determine trend (price vs SMA)
      const trend = currentPrice > sma24h ? 'bullish' : 'bearish';
      const trendStrength = Math.abs((currentPrice - sma24h) / sma24h) * 100;
      
      // Determine volatility regime
      let volatilityRegime = 'normal';
      if (recentVol > 0.03) volatilityRegime = 'high';
      else if (recentVol < 0.01) volatilityRegime = 'low';
      
      // Create context object
      const context = {
        rsi: Math.round(rsi * 100) / 100,
        rsi_state: rsiState,
        trend: trend,
        trend_strength: Math.round(trendStrength * 100) / 100,
        sma_24h: Math.round(sma24h * 100) / 100,
        volatility: Math.round(recentVol * 10000) / 100,
        volatility_regime: volatilityRegime
      };
      
      // 24h prediction: compound the 1h return over 24 periods with increased uncertainty
      const hourlyReturn = pred1h.predicted_change_percent / 100;
      const pred24hChange = Math.pow(1 + hourlyReturn, 24) - 1;
      const pred24hPrice = currentPrice * (1 + pred24hChange);
      const vol24hMultiplier = recentVol * 4; // Higher uncertainty for longer horizon
      const pred24hLow = Math.max(0, pred24hPrice - (currentPrice * vol24hMultiplier));
      const pred24hHigh = pred24hPrice + (currentPrice * vol24hMultiplier);
      
      // 7d prediction: further extrapolation with even more uncertainty
      const pred7dChange = Math.pow(1 + hourlyReturn, 168) - 1; // 168 hours in 7 days
      const pred7dPrice = currentPrice * (1 + pred7dChange);
      const vol7dMultiplier = recentVol * 8; // Even higher uncertainty
      const pred7dLow = Math.max(0, pred7dPrice - (currentPrice * vol7dMultiplier));
      const pred7dHigh = pred7dPrice + (currentPrice * vol7dMultiplier);
      
      const now = Date.now();
      const predictions = {
        '1h': { ...pred1h, context },
        context: context,
        '24h': {
          model_id: 'lstm_btc_extrapolated',
          model_type: 'Volatility Extrapolation',
          predicted_price: Math.round(pred24hPrice * 100) / 100,
          predicted_low: Math.round(pred24hLow * 100) / 100,
          predicted_high: Math.round(pred24hHigh * 100) / 100,
          current_price: currentPrice,
          predicted_change: Math.round((pred24hPrice - currentPrice) * 100) / 100,
          predicted_change_percent: Math.round(pred24hChange * 10000) / 100,
          confidence: Math.max(0.1, Math.min(0.8, 1 - (recentVol * 15))), // Lower confidence
          horizon: '24h',
          timestamp: now,
          prediction_for: now + 86400000,
          context
        },
        '7d': {
          model_id: 'lstm_btc_extrapolated',
          model_type: 'Volatility Extrapolation',
          predicted_price: Math.round(pred7dPrice * 100) / 100,
          predicted_low: Math.round(pred7dLow * 100) / 100,
          predicted_high: Math.round(pred7dHigh * 100) / 100,
          current_price: currentPrice,
          predicted_change: Math.round((pred7dPrice - currentPrice) * 100) / 100,
          predicted_change_percent: Math.round(pred7dChange * 10000) / 100,
          confidence: Math.max(0.1, Math.min(0.6, 1 - (recentVol * 20))), // Even lower confidence
          horizon: '7d',
          timestamp: now,
          prediction_for: now + 604800000,
          context
        },
        timestamp: now
      };

      console.log('✅ Multi-horizon predictions generated');
      console.log(`   1h:  $${pred1h.predicted_price.toLocaleString()} (${pred1h.predicted_change_percent > 0 ? '+' : ''}${pred1h.predicted_change_percent}%)`);
      console.log(`   24h: $${predictions['24h'].predicted_price.toLocaleString()} (${predictions['24h'].predicted_change_percent > 0 ? '+' : ''}${predictions['24h'].predicted_change_percent}%)`);
      console.log(`   7d:  $${predictions['7d'].predicted_price.toLocaleString()} (${predictions['7d'].predicted_change_percent > 0 ? '+' : ''}${predictions['7d'].predicted_change_percent}%)\n`);

      return predictions;
    } catch (error) {
      console.error('❌ Multi-horizon prediction failed:', error.message);
      throw error;
    }
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
