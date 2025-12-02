# AI Bitcoin Price Prediction Model - Research & Implementation Plan

**Date:** November 28, 2025  
**Status:** Research Phase  
**Author:** GitHub Copilot  

---

## 1. Executive Summary

This document provides a **thorough research-based plan** for implementing an AI-powered Bitcoin price prediction model that integrates seamlessly with the existing Node.js/Express/SQLite stack.

### Key Objectives
- Build a **production-ready AI model** for BTC price prediction
- Integrate with existing backend without breaking current functionality
- Use **accurate, real-time data** from reliable sources
- Provide predictions with confidence scores and evaluation metrics
- Support multiple prediction horizons (1h, 24h, 7d)

### Critical Requirements (Based on Feedback)
1. **Proper AI model** - Not simple moving averages or naive baselines
2. **Accurate data fetching** - Use real CoinGecko/blockchain.info APIs correctly
3. **Tech stack compatibility** - Must work with Node.js v20.x + SQLite
4. **Realistic predictions** - Based on historical patterns and market indicators

---

## 2. Current Tech Stack Audit

### 2.1 Runtime Environment
- **Node.js:** v20.19.5 (LTS with ES modules support)
- **Package Manager:** npm 10.8.2
- **Module System:** ES Modules (`"type": "module"` in package.json)

### 2.2 Existing Dependencies
```json
{
  "better-sqlite3": "^12.4.1",   // Synchronous SQLite3 with great performance
  "express": "^5.1.0",            // Web framework
  "cors": "^2.8.5",
  "dotenv": "^16.5.0",
  "node-fetch": "^3.3.2",         // HTTP client
  "chart.js": "^4.5.0",           // Charting (frontend-related)
  "chartjs-chart-financial": "^0.2.1"
}
```

### 2.3 Database Schema (SQLite)
Existing tables relevant to ML:
- **prices** - BTC price history (164 rows currently)
- **hashrate_history** - Network hashrate (361 rows)
- **difficulty_history** - Mining difficulty (361 rows)
- **metric_correlations** - Computed correlations
- **predictions** - Storage for model predictions (24 rows)
- **models** - Model metadata (3 rows)
- **blockchain_blocks** - Block data
- **corporate_treasuries** - Institutional holdings
- **ohlcv** - OHLC candlestick data

### 2.4 Data Sources (Already Integrated)
1. **CoinGecko API** - BTC price, market data, historical prices
2. **Blockchain.info** - Network hashrate, supply metrics
3. **Mempool.space** - Mempool stats, fee estimates, blocks
4. **CoinDesk** - Alternative price source (OHLCV backfill)

### 2.5 Current Data Volume Issues
⚠️ **Critical Finding:** Only **164 price records** in database
- Insufficient for training deep learning models (need 1000s of samples)
- Need to backfill historical data before training
- Current polling services may not be running consistently

---

## 3. AI/ML Options Research for Node.js

### 3.1 Option A: TensorFlow.js (Recommended ✅)

**Library:** `@tensorflow/tfjs-node`

**Pros:**
- Full TensorFlow ecosystem in JavaScript
- Native C++ bindings for performance
- Supports LSTM, GRU, CNN, Transformer architectures
- Mature API with extensive documentation
- Model training, evaluation, and inference
- Can import pre-trained Python models (SavedModel format)
- Active community and Google backing

**Cons:**
- Larger dependency (~50MB)
- Steeper learning curve
- Requires understanding of tensor operations

**Best For:** Production-grade deep learning models with good accuracy

**Example Architecture:**
```javascript
import * as tf from '@tensorflow/tfjs-node';

// LSTM for time series forecasting
const model = tf.sequential({
  layers: [
    tf.layers.lstm({ units: 50, returnSequences: true, inputShape: [60, 10] }),
    tf.layers.dropout({ rate: 0.2 }),
    tf.layers.lstm({ units: 50, returnSequences: false }),
    tf.layers.dropout({ rate: 0.2 }),
    tf.layers.dense({ units: 25 }),
    tf.layers.dense({ units: 1 })
  ]
});

model.compile({
  optimizer: tf.train.adam(0.001),
  loss: 'meanSquaredError',
  metrics: ['mae']
});
```

### 3.2 Option B: Brain.js

**Library:** `brain.js`

**Pros:**
- Very simple API for neural networks
- Built for JavaScript from the ground up
- Lightweight (~500KB)
- Easy to get started
- Good for prototyping

**Cons:**
- Limited architecture options
- Slower training than TensorFlow.js
- Less flexible for complex models
- Smaller community
- No native LSTM/GRU implementations (only recurrent)

**Best For:** Simple prototypes or basic neural networks

### 3.3 Option C: ML.js + Classical Models

**Library:** `ml-regression`, `ml-matrix`, custom ARIMA

**Pros:**
- Lightweight JavaScript implementations
- No heavy dependencies
- Fast inference
- Interpretable models (linear regression, polynomial)

**Cons:**
- Limited to classical ML (no deep learning)
- Lower accuracy for complex patterns
- Manual feature engineering required
- Not state-of-the-art for time series

**Best For:** Baseline models or ensemble components

### 3.4 Option D: Python Microservice (Hybrid Approach)

**Architecture:** Node.js backend → Python ML service (Flask/FastAPI)

**Pros:**
- Access to scikit-learn, XGBoost, PyTorch, Prophet
- Best ML ecosystem available
- Can use pre-trained models easily
- Better debugging tools

**Cons:**
- Additional deployment complexity (Docker multi-container)
- Inter-service communication overhead
- Two codebases to maintain
- Requires Python runtime in production

**Best For:** Maximum ML flexibility if deployment complexity is acceptable

### 3.5 Recommendation: **TensorFlow.js** 🎯

**Rationale:**
- Production-grade deep learning in pure Node.js
- No additional microservices needed
- Good balance of accuracy and deployment simplicity
- Can leverage LSTM/GRU for time series forecasting
- Model persistence with native TensorFlow formats
- Future-proof with active development

---

## 4. Model Architecture Design

### 4.1 Proposed Model: LSTM-Based Ensemble

**Primary Model:** Bidirectional LSTM with attention mechanism

```
Input Features (60 timesteps × 15 features)
    ↓
[Bidirectional LSTM Layer 1] (64 units)
    ↓
[Dropout 0.2]
    ↓
[Bidirectional LSTM Layer 2] (32 units)
    ↓
[Attention Layer] (self-attention mechanism)
    ↓
[Dense Layer 1] (16 units, ReLU)
    ↓
[Dropout 0.1]
    ↓
[Dense Layer 2] (1 unit, Linear) → Price Prediction
```

**Why LSTM?**
- Designed for sequential data and time series
- Captures long-term dependencies in price movements
- Proven effective for financial forecasting
- Handles variable-length sequences

**Why Bidirectional?**
- Looks at past AND future context (in training)
- Better pattern recognition
- Improved accuracy over unidirectional

### 4.2 Feature Engineering

#### Price Features (8 features)
1. `log_return_1h` - Log return over 1 hour
2. `log_return_4h` - Log return over 4 hours
3. `log_return_24h` - Log return over 24 hours
4. `sma_24h` - Simple moving average 24h (normalized)
5. `ema_12h` - Exponential moving average 12h
6. `ema_26h` - Exponential moving average 26h
7. `volatility_24h` - Rolling standard deviation 24h
8. `rsi_14` - Relative Strength Index (14 periods)

#### On-Chain Features (5 features)
9. `hashrate_normalized` - Network hashrate (min-max normalized)
10. `hashrate_change_pct` - % change in hashrate (24h)
11. `difficulty_normalized` - Mining difficulty (normalized)
12. `difficulty_change_pct` - % change at last adjustment
13. `mempool_size_normalized` - Pending transactions (normalized)

#### Market Features (2 features)
14. `hour_sin` - sin(2π × hour/24) for daily seasonality
15. `day_cos` - cos(2π × day/7) for weekly seasonality

**Total: 15 features × 60 timesteps = 900 input values per sample**

### 4.3 Target Variable

**Regression Target:** Predict price at horizon
- 1-hour ahead: `price_t+1`
- 24-hour ahead: `price_t+24`
- 7-day ahead: `price_t+168`

**Multi-output:** Train 3 separate models (or single multi-output model)

### 4.4 Data Preprocessing

```javascript
// Feature normalization
function minMaxNormalize(value, min, max) {
  return (value - min) / (max - min);
}

// Z-score normalization for returns/volatility
function zScoreNormalize(value, mean, stdDev) {
  return (value - mean) / stdDev;
}

// Sliding window creation
function createSequences(data, lookback = 60) {
  const X = [], y = [];
  for (let i = lookback; i < data.length; i++) {
    X.push(data.slice(i - lookback, i)); // 60 timesteps
    y.push(data[i].target_price);
  }
  return { X, y };
}
```

---

## 5. Data Pipeline Implementation

### 5.1 Historical Data Backfill (Critical First Step)

**Problem:** Only 164 price records currently
**Solution:** Backfill 2+ years of hourly data

```javascript
// backend/scripts/backfill-historical-data.js
import { fetchHistoricalPrices } from './backfill-prices.js';

async function backfillForTraining() {
  console.log('📊 Backfilling historical data for ML training...');
  
  // Fetch 2 years of hourly data (17,520 hours)
  await fetchHistoricalPrices('BTC', 730); // 2 years
  
  // Verify data count
  const count = getPriceCount('BTC');
  console.log(`✅ Total BTC price records: ${count}`);
  
  if (count < 1000) {
    throw new Error('Insufficient data for training (need 1000+ samples)');
  }
}
```

**Timeline:** Run this BEFORE training (can take 5-10 minutes)

### 5.2 Feature Store Service

```javascript
// backend/app/services/featureStore.js
export class FeatureStore {
  constructor() {
    this.stats = null; // Normalization statistics
  }
  
  async computeFeatures(timestamp, lookback = 60) {
    const prices = await getPriceHistory('BTC', timestamp - lookback*3600*1000, timestamp);
    const hashrates = await getHashrateHistory(timestamp - lookback*3600*1000, timestamp);
    const difficulties = await getDifficultyHistory(timestamp - lookback*3600*1000, timestamp);
    
    const features = [];
    
    for (let i = 0; i < lookback; i++) {
      features.push({
        // Price features
        log_return_1h: this.logReturn(prices, i, 1),
        log_return_4h: this.logReturn(prices, i, 4),
        log_return_24h: this.logReturn(prices, i, 24),
        sma_24h: this.sma(prices, i, 24),
        ema_12h: this.ema(prices, i, 12),
        ema_26h: this.ema(prices, i, 26),
        volatility_24h: this.volatility(prices, i, 24),
        rsi_14: this.rsi(prices, i, 14),
        
        // On-chain features
        hashrate_normalized: this.normalize(hashrates[i], 'hashrate'),
        hashrate_change_pct: this.pctChange(hashrates, i, 24),
        difficulty_normalized: this.normalize(difficulties[i], 'difficulty'),
        difficulty_change_pct: this.pctChange(difficulties, i, 1),
        mempool_size_normalized: this.normalize(await getMempoolSize(timestamp), 'mempool'),
        
        // Temporal features
        hour_sin: Math.sin(2 * Math.PI * new Date(timestamp).getHours() / 24),
        day_cos: Math.cos(2 * Math.PI * new Date(timestamp).getDay() / 7)
      });
    }
    
    return features;
  }
  
  logReturn(prices, idx, periods) {
    if (idx < periods) return 0;
    return Math.log(prices[idx].price / prices[idx - periods].price);
  }
  
  // ... other helper methods
}
```

### 5.3 Training Dataset Builder

```javascript
// backend/scripts/build-training-dataset.js
export async function buildDataset() {
  const prices = await getAllPrices('BTC'); // All historical data
  const featureStore = new FeatureStore();
  
  // Compute normalization statistics
  await featureStore.computeStats(prices);
  
  const dataset = [];
  
  for (let i = 60; i < prices.length - 168; i++) { // Need 60 lookback + 168 lookahead
    const timestamp = prices[i].ts;
    
    const features = await featureStore.computeFeatures(timestamp, 60);
    
    const targets = {
      price_1h: prices[i + 1].price,
      price_24h: prices[i + 24].price,
      price_7d: prices[i + 168].price
    };
    
    dataset.push({ features, targets, timestamp });
  }
  
  // Train/val/test split (70/15/15)
  const trainSize = Math.floor(dataset.length * 0.7);
  const valSize = Math.floor(dataset.length * 0.15);
  
  return {
    train: dataset.slice(0, trainSize),
    validation: dataset.slice(trainSize, trainSize + valSize),
    test: dataset.slice(trainSize + valSize)
  };
}
```

---

## 6. Training Pipeline

### 6.1 Model Training Script

```javascript
// backend/scripts/train-lstm-model.js
import * as tf from '@tensorflow/tfjs-node';
import { buildDataset } from './build-training-dataset.js';

async function trainModel() {
  console.log('🧠 Starting LSTM model training...');
  
  // 1. Build dataset
  const { train, validation, test } = await buildDataset();
  console.log(`Dataset: ${train.length} train, ${validation.length} val, ${test.length} test`);
  
  // 2. Convert to tensors
  const trainX = tf.tensor3d(train.map(s => s.features)); // [samples, 60, 15]
  const trainY = tf.tensor2d(train.map(s => [s.targets.price_1h]));
  
  const valX = tf.tensor3d(validation.map(s => s.features));
  const valY = tf.tensor2d(validation.map(s => [s.targets.price_1h]));
  
  // 3. Build model
  const model = tf.sequential({
    layers: [
      tf.layers.bidirectional({
        layer: tf.layers.lstm({ units: 64, returnSequences: true }),
        inputShape: [60, 15]
      }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.bidirectional({
        layer: tf.layers.lstm({ units: 32, returnSequences: false })
      }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: 16, activation: 'relu' }),
      tf.layers.dropout({ rate: 0.1 }),
      tf.layers.dense({ units: 1 }) // Price prediction
    ]
  });
  
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
    metrics: ['mae', 'mape']
  });
  
  // 4. Train
  const history = await model.fit(trainX, trainY, {
    epochs: 100,
    batchSize: 32,
    validationData: [valX, valY],
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch + 1}: loss=${logs.loss.toFixed(4)}, val_loss=${logs.val_loss.toFixed(4)}`);
      }
    }
  });
  
  // 5. Evaluate
  const testX = tf.tensor3d(test.map(s => s.features));
  const testY = tf.tensor2d(test.map(s => [s.targets.price_1h]));
  const evalResults = model.evaluate(testX, testY);
  
  console.log(`Test MAE: ${evalResults[1].dataSync()[0]}`);
  console.log(`Test MAPE: ${evalResults[2].dataSync()[0]}%`);
  
  // 6. Save model
  await model.save('file://./models/lstm-btc-1h');
  console.log('✅ Model saved to ./models/lstm-btc-1h');
  
  // Clean up
  tf.dispose([trainX, trainY, valX, valY, testX, testY]);
}

trainModel().catch(console.error);
```

### 6.2 Expected Training Time

- **Dataset Size:** ~15,000 samples (2 years hourly data)
- **Training Time:** 10-30 minutes on CPU (faster on GPU if available)
- **Epochs:** 50-100 epochs
- **Early Stopping:** Monitor validation loss

---

## 7. Inference Service

### 7.1 Real-Time Prediction Service

```javascript
// backend/app/services/aiPredictionService.js
import * as tf from '@tensorflow/tfjs-node';
import { FeatureStore } from './featureStore.js';

export class AIPredictionService {
  constructor() {
    this.model = null;
    this.featureStore = new FeatureStore();
    this.initialized = false;
  }
  
  async initialize() {
    if (this.initialized) return;
    
    console.log('🤖 Loading LSTM model...');
    this.model = await tf.loadLayersModel('file://./models/lstm-btc-1h/model.json');
    await this.featureStore.loadStats(); // Load normalization stats
    
    this.initialized = true;
    console.log('✅ AI prediction service ready');
  }
  
  async predictPrice(horizon = '1h') {
    if (!this.initialized) await this.initialize();
    
    const now = Date.now();
    const features = await this.featureStore.computeFeatures(now, 60);
    
    // Convert to tensor [1, 60, 15]
    const inputTensor = tf.tensor3d([features]);
    
    // Predict
    const predictionTensor = this.model.predict(inputTensor);
    const predictedPrice = predictionTensor.dataSync()[0];
    
    // Compute confidence (inverse of recent volatility)
    const recentVol = features[features.length - 1].volatility_24h;
    const confidence = Math.max(0, Math.min(1, 1 - recentVol / 0.1));
    
    // Clean up
    tf.dispose([inputTensor, predictionTensor]);
    
    return {
      model_id: 'lstm_btc_1h_v1',
      predicted_price: predictedPrice,
      confidence: confidence,
      horizon: horizon,
      timestamp: now
    };
  }
}
```

### 7.2 Scheduled Predictions

```javascript
// backend/app/services/aiPredictionPoller.js
import { AIPredictionService } from './aiPredictionService.js';
import { insertPrediction } from '../db/predictionsDb.js';

const service = new AIPredictionService();

export async function startAIPredictionPolling() {
  await service.initialize();
  
  // Generate prediction immediately
  await generateAndStorePrediction();
  
  // Then every hour
  setInterval(generateAndStorePrediction, 60 * 60 * 1000);
  
  console.log('🔄 AI prediction polling started (hourly)');
}

async function generateAndStorePrediction() {
  try {
    const prediction = await service.predictPrice('1h');
    
    await insertPrediction(
      prediction.model_id,
      'BTC',
      prediction.predicted_price,
      prediction.confidence,
      prediction.horizon,
      prediction.timestamp
    );
    
    console.log(`✅ AI Prediction: $${prediction.predicted_price.toFixed(2)} (${(prediction.confidence * 100).toFixed(1)}% confidence)`);
  } catch (error) {
    console.error('❌ AI prediction failed:', error);
  }
}
```

---

## 8. Implementation Phases

### Phase 1: Data Foundation (Week 1)
- [ ] Backfill 2 years of hourly BTC price data
- [ ] Verify hashrate and difficulty history is complete
- [ ] Implement `FeatureStore` class with all 15 features
- [ ] Build and validate training dataset
- [ ] Create train/validation/test splits

**Deliverable:** Dataset ready with 10,000+ training samples

### Phase 2: Model Development (Week 2)
- [ ] Install TensorFlow.js (`npm install @tensorflow/tfjs-node`)
- [ ] Implement LSTM model architecture
- [ ] Train initial model (50-100 epochs)
- [ ] Evaluate on test set (MAE, RMSE, MAPE, directional accuracy)
- [ ] Save trained model to disk

**Deliverable:** Trained model with test MAE < 5% of price

### Phase 3: Integration (Week 3)
- [ ] Implement `AIPredictionService` for inference
- [ ] Wire up hourly prediction polling
- [ ] Store predictions in database
- [ ] Create API endpoints:
  - `GET /api/ai/predictions/latest`
  - `GET /api/ai/predictions/history`
  - `GET /api/ai/model/metrics`
- [ ] Add frontend components to display predictions

**Deliverable:** Live predictions visible in dashboard

### Phase 4: Monitoring & Improvement (Week 4)
- [ ] Track prediction accuracy in production
- [ ] Implement retraining pipeline (weekly or monthly)
- [ ] Add confidence intervals
- [ ] Create performance dashboard
- [ ] Document API usage

**Deliverable:** Production-ready AI prediction system

---

## 9. Evaluation Metrics

### 9.1 Standard Metrics

```javascript
// Mean Absolute Error
function mae(actual, predicted) {
  const errors = actual.map((a, i) => Math.abs(a - predicted[i]));
  return errors.reduce((sum, e) => sum + e, 0) / errors.length;
}

// Root Mean Squared Error
function rmse(actual, predicted) {
  const errors = actual.map((a, i) => Math.pow(a - predicted[i], 2));
  return Math.sqrt(errors.reduce((sum, e) => sum + e, 0) / errors.length);
}

// Mean Absolute Percentage Error
function mape(actual, predicted) {
  const errors = actual.map((a, i) => Math.abs((a - predicted[i]) / a));
  return (errors.reduce((sum, e) => sum + e, 0) / errors.length) * 100;
}

// Directional Accuracy
function directionalAccuracy(actual, predicted) {
  let correct = 0;
  for (let i = 1; i < actual.length; i++) {
    const actualDir = actual[i] > actual[i-1];
    const predDir = predicted[i] > actual[i-1];
    if (actualDir === predDir) correct++;
  }
  return (correct / (actual.length - 1)) * 100;
}
```

### 9.2 Target Performance

- **MAE:** < $2,000 (< 2% of current BTC price ~$100k)
- **MAPE:** < 5%
- **Directional Accuracy:** > 60% (better than random)
- **Inference Time:** < 100ms per prediction

---

## 10. Risk Mitigation

### Risk 1: Insufficient Training Data
**Mitigation:** Backfill 2+ years before training; augment with external datasets if needed

### Risk 2: Model Overfitting
**Mitigation:** Use dropout layers, early stopping, validation set monitoring

### Risk 3: Concept Drift (Market Changes)
**Mitigation:** Retrain model monthly; monitor prediction accuracy in production

### Risk 4: API Rate Limits
**Mitigation:** Cache data aggressively; use multiple data sources as fallback

### Risk 5: Deployment Complexity
**Mitigation:** TensorFlow.js keeps everything in Node.js; no separate Python service needed

---

## 11. Next Steps (Immediate Actions)

1. **Get Approval** - Review this plan and confirm approach
2. **Install Dependencies** - Add TensorFlow.js to package.json
3. **Backfill Data** - Run historical data collection (1-2 hours)
4. **Build Feature Store** - Implement feature engineering (1 day)
5. **Train First Model** - Initial LSTM training (1 day)
6. **Integrate & Test** - Wire up prediction service (1 day)

**Estimated Total Time:** 2-3 weeks for full production deployment

---

## 12. References & Resources

- [TensorFlow.js Documentation](https://www.tensorflow.org/js)
- [LSTM for Time Series Forecasting](https://machinelearningmastery.com/lstm-for-time-series-prediction-in-pytorch/)
- [Bitcoin Price Prediction Research](https://arxiv.org/abs/1904.05315)
- [Feature Engineering for Crypto](https://medium.com/coinmonks/bitcoin-price-prediction-with-machine-learning)

---

**Status:** ✅ Ready for implementation pending approval
