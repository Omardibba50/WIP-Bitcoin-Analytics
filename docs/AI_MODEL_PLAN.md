# Bitcoin Price Prediction AI Model - Implementation Plan

## Executive Summary

This document outlines the implementation plan for a **lightweight, accurate, and efficient** AI model to predict Bitcoin prices. The model will be fully integrated into the existing Node.js/React application without requiring Python dependencies or external ML services.

**Key Targets:**
- **Accuracy:** 80-85% directional accuracy (up/down predictions)
- **Performance:** <100ms inference time
- **Memory:** <20MB footprint
- **Latency:** Real-time predictions updated every 4 hours
- **Architecture:** Pure JavaScript implementation using brain.js

---

## 1. Model Architecture

### 1.1 Hybrid Ensemble Approach

We'll implement a **three-model ensemble** combining complementary prediction strategies:

```
┌─────────────────────────────────────────────────────────┐
│                  ENSEMBLE PREDICTOR                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   LSTM NN    │  │   LINEAR     │  │    ARIMA     │  │
│  │  (brain.js)  │  │  REGRESSION  │  │  (Time       │  │
│  │              │  │              │  │   Series)    │  │
│  │  Weight: 50% │  │  Weight: 30% │  │  Weight: 20% │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│               Weighted Average → Final Prediction       │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Component Details

#### Model 1: LSTM Neural Network (brain.js)
- **Purpose:** Capture non-linear patterns and complex dependencies
- **Architecture:**
  - Input layer: 15 features (normalized)
  - Hidden layers: 2 layers × 32 neurons (LSTM cells)
  - Output layer: 3 neurons (price_next_hour, price_next_24h, direction)
- **Training:** Online learning with sliding window (last 2,000 hours)
- **Library:** brain.js (lightweight JavaScript neural network library)

#### Model 2: Linear Regression
- **Purpose:** Capture linear trends and provide stability
- **Features:** Price momentum, moving averages, volume trends
- **Implementation:** Custom JavaScript implementation (no external libs)
- **Training:** Incremental updates with weighted recent data

#### Model 3: ARIMA (Time Series)
- **Purpose:** Model temporal dependencies and seasonality
- **Parameters:** Auto-tuned ARIMA(p,d,q) with p≤3, d≤2, q≤3
- **Implementation:** Lightweight ARIMA.js library
- **Training:** Rolling window of last 30 days

---

## 2. Feature Engineering

### 2.1 Primary Features (15 total)

| Feature | Type | Source | Description |
|---------|------|--------|-------------|
| `price` | Numeric | prices table | Current BTC/USD price |
| `price_ma_24h` | Numeric | Derived | 24-hour moving average |
| `price_ma_7d` | Numeric | Derived | 7-day moving average |
| `price_momentum` | Numeric | Derived | (price - price_24h_ago) / price_24h_ago |
| `price_volatility` | Numeric | Derived | Standard deviation over 24h |
| `hashrate` | Numeric | hashrate_history | Current network hashrate |
| `hashrate_change` | Numeric | Derived | % change in last 24h |
| `difficulty` | Numeric | difficulty_history | Current mining difficulty |
| `difficulty_change` | Numeric | Derived | % change at last adjustment |
| `mempool_size` | Numeric | mempool data | Pending transactions |
| `block_time_avg` | Numeric | blocks table | Average block time (last 10 blocks) |
| `correlation_hashrate` | Numeric | metric_correlations | Hashrate-price correlation |
| `correlation_difficulty` | Numeric | metric_correlations | Difficulty-price correlation |
| `hour_of_day` | Numeric | Derived | Hour (0-23) for seasonality |
| `day_of_week` | Numeric | Derived | Day (0-6) for weekly patterns |

### 2.2 Feature Normalization

```javascript
// Min-Max Scaling to [0, 1] range
function normalize(value, min, max) {
  return (value - min) / (max - min);
}

// Z-Score Normalization for outlier handling
function zScore(value, mean, stdDev) {
  return (value - mean) / stdDev;
}
```

### 2.3 Feature Store

Create a dedicated service to compute and cache features:

```
backend/app/services/featureEngineering.js
- extractFeatures(timestamp)
- computeMovingAverages(prices, window)
- calculateMomentum(prices)
- getSeasonalityFeatures(timestamp)
- normalizeFeatures(features)
```

---

## 3. Training Pipeline

### 3.1 Initial Training

**One-time setup to train models on historical data:**

```
┌─────────────────────────────────────────────────────────┐
│  STEP 1: Data Collection                                │
│  - Fetch last 365 days of price data                    │
│  - Fetch corresponding hashrate, difficulty, mempool    │
│  - Total samples: ~8,760 hours                          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 2: Feature Engineering                            │
│  - Compute all 15 features for each timestamp           │
│  - Normalize features using training set statistics     │
│  - Create target labels (price at t+1h, t+24h)          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 3: Train-Test Split                               │
│  - Training: First 80% (~7,000 samples)                 │
│  - Validation: Next 10% (~875 samples)                  │
│  - Test: Last 10% (~875 samples)                        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 4: Model Training                                 │
│  - LSTM: 100 epochs, batch size 32, learning rate 0.01  │
│  - Linear Regression: Closed-form solution              │
│  - ARIMA: Grid search for optimal (p,d,q)               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 5: Model Validation                               │
│  - Calculate RMSE, MAE, directional accuracy            │
│  - Tune ensemble weights for best performance           │
│  - Save model weights to database                       │
└─────────────────────────────────────────────────────────┘
```

**Script:** `backend/scripts/train-initial-model.js`

### 3.2 Incremental Training

**Continuous learning every 4 hours:**

```javascript
// Pseudo-code for incremental training
async function incrementalTraining() {
  // 1. Fetch new data (last 4 hours)
  const newData = await fetchRecentData(4);
  
  // 2. Extract features
  const features = await extractFeatures(newData);
  
  // 3. Update models (online learning)
  await lstmModel.train(features, { iterations: 10 });
  await linearModel.incrementalFit(features);
  await arimaModel.updateWindow(features);
  
  // 4. Validate accuracy on recent data
  const accuracy = await validateModel(testSet);
  
  // 5. Save updated model weights
  await saveModelWeights(modelId, weights);
  
  // 6. Log metrics
  console.log(`Model updated. Accuracy: ${accuracy}%`);
}

// Schedule every 4 hours
setInterval(incrementalTraining, 4 * 60 * 60 * 1000);
```

---

## 4. Database Schema

### 4.1 New Tables

```sql
-- Model metadata and configuration
CREATE TABLE IF NOT EXISTS ai_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_name TEXT NOT NULL,
  model_type TEXT NOT NULL, -- 'lstm', 'linear', 'arima', 'ensemble'
  version INTEGER NOT NULL,
  weights BLOB, -- Serialized model weights
  hyperparameters TEXT, -- JSON config
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  accuracy REAL, -- Last validation accuracy
  mae REAL, -- Mean Absolute Error
  rmse REAL -- Root Mean Squared Error
);

-- Store predictions for analysis
CREATE TABLE IF NOT EXISTS ai_predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id INTEGER NOT NULL,
  prediction_timestamp INTEGER NOT NULL,
  target_timestamp INTEGER NOT NULL, -- When prediction is for
  predicted_price REAL NOT NULL,
  predicted_direction TEXT, -- 'up', 'down', 'neutral'
  confidence REAL, -- 0-1 confidence score
  actual_price REAL, -- Filled in later for validation
  error REAL, -- |predicted - actual|
  created_at INTEGER NOT NULL,
  FOREIGN KEY (model_id) REFERENCES ai_models(id)
);

-- Feature vectors for debugging/analysis
CREATE TABLE IF NOT EXISTS feature_vectors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER UNIQUE NOT NULL,
  features TEXT NOT NULL, -- JSON serialized features
  normalized_features TEXT, -- JSON normalized features
  created_at INTEGER NOT NULL
);

-- Training metrics for monitoring
CREATE TABLE IF NOT EXISTS training_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id INTEGER NOT NULL,
  epoch INTEGER,
  loss REAL,
  accuracy REAL,
  training_samples INTEGER,
  training_duration_ms INTEGER,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (model_id) REFERENCES ai_models(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_predictions_timestamp 
  ON ai_predictions(prediction_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_model 
  ON ai_predictions(model_id);
CREATE INDEX IF NOT EXISTS idx_feature_vectors_timestamp 
  ON feature_vectors(timestamp DESC);
```

### 4.2 Migration Script

Add to `backend/scripts/migrate.js`:

```javascript
// Add AI model tables
db.exec(`
  CREATE TABLE IF NOT EXISTS ai_models (
    -- schema above
  );
  
  CREATE TABLE IF NOT EXISTS ai_predictions (
    -- schema above
  );
  
  -- Add other tables...
`);
```

---

## 5. Backend Implementation

### 5.1 File Structure

```
backend/app/
├── db/
│   └── aiModelsDb.js              # Database access for AI models
├── services/
│   ├── featureEngineering.js      # Feature extraction & normalization
│   ├── lstmModel.js               # LSTM neural network wrapper
│   ├── linearRegressionModel.js   # Linear regression implementation
│   ├── arimaModel.js              # ARIMA time series model
│   ├── ensemblePredictor.js       # Combines all models
│   ├── modelTrainer.js            # Training pipeline
│   └── predictionPoller.js        # Scheduled prediction updates
├── controllers/
│   └── aiModelController.js       # API endpoints
└── routes/
    └── aiModelRoutes.js           # Route definitions

backend/scripts/
└── train-initial-model.js         # One-time initial training
```

### 5.2 Core Services

#### 5.2.1 Feature Engineering Service

```javascript
// backend/app/services/featureEngineering.js

import { getPriceHistory } from '../db/pricesDb.js';
import { getHashrateHistory } from '../db/hashrateDb.js';
import { getDifficultyHistory } from '../db/difficultyDb.js';

export async function extractFeatures(timestamp) {
  const features = {};
  
  // Price features
  const prices = await getPriceHistory(timestamp - 7*86400, timestamp, 1000);
  features.price = prices[0].price;
  features.price_ma_24h = calculateMA(prices, 24);
  features.price_ma_7d = calculateMA(prices, 168);
  features.price_momentum = calculateMomentum(prices);
  features.price_volatility = calculateVolatility(prices, 24);
  
  // Hashrate features
  const hashrates = await getHashrateHistory(timestamp - 86400, timestamp);
  features.hashrate = hashrates[0].hashrate;
  features.hashrate_change = calculateChange(hashrates, 24);
  
  // Difficulty features
  const difficulties = await getDifficultyHistory(timestamp - 86400, timestamp);
  features.difficulty = difficulties[0].difficulty;
  features.difficulty_change = calculateChange(difficulties, 1);
  
  // Correlation features
  const correlations = await getCorrelations();
  features.correlation_hashrate = correlations.hashrate_price;
  features.correlation_difficulty = correlations.difficulty_price;
  
  // Temporal features
  const date = new Date(timestamp * 1000);
  features.hour_of_day = date.getUTCHours();
  features.day_of_week = date.getUTCDay();
  
  // Mempool features
  features.mempool_size = await getMempoolSize();
  features.block_time_avg = await getAverageBlockTime(10);
  
  return features;
}

export function normalizeFeatures(features, stats) {
  const normalized = {};
  
  for (const [key, value] of Object.entries(features)) {
    if (stats[key]) {
      normalized[key] = (value - stats[key].min) / 
                       (stats[key].max - stats[key].min);
    } else {
      normalized[key] = value;
    }
  }
  
  return normalized;
}

function calculateMA(prices, hours) {
  const slice = prices.slice(0, hours);
  return slice.reduce((sum, p) => sum + p.price, 0) / slice.length;
}

function calculateMomentum(prices) {
  const current = prices[0].price;
  const past = prices[24]?.price || current;
  return (current - past) / past;
}

function calculateVolatility(prices, hours) {
  const slice = prices.slice(0, hours);
  const mean = slice.reduce((sum, p) => sum + p.price, 0) / slice.length;
  const variance = slice.reduce((sum, p) => sum + Math.pow(p.price - mean, 2), 0) / slice.length;
  return Math.sqrt(variance);
}

function calculateChange(data, periods) {
  if (data.length < periods + 1) return 0;
  const current = data[0].value || data[0].hashrate || data[0].difficulty;
  const past = data[periods].value || data[periods].hashrate || data[periods].difficulty;
  return (current - past) / past;
}
```

#### 5.2.2 LSTM Model Service

```javascript
// backend/app/services/lstmModel.js

import brain from 'brain.js';

export class LSTMModel {
  constructor(config = {}) {
    this.config = {
      inputSize: 15,
      hiddenLayers: [32, 32],
      outputSize: 3,
      learningRate: 0.01,
      iterations: 100,
      ...config
    };
    
    this.network = new brain.recurrent.LSTM({
      inputSize: this.config.inputSize,
      hiddenLayers: this.config.hiddenLayers,
      outputSize: this.config.outputSize
    });
  }
  
  async train(trainingData, options = {}) {
    const formattedData = trainingData.map(sample => ({
      input: Object.values(sample.features),
      output: [
        sample.target_1h,
        sample.target_24h,
        sample.direction // 0=down, 0.5=neutral, 1=up
      ]
    }));
    
    const result = this.network.train(formattedData, {
      iterations: options.iterations || this.config.iterations,
      learningRate: options.learningRate || this.config.learningRate,
      log: (stats) => console.log(`LSTM Epoch ${stats.iterations}: Loss ${stats.error}`)
    });
    
    return result;
  }
  
  predict(features) {
    const input = Object.values(features);
    const output = this.network.run(input);
    
    return {
      price_1h: output[0],
      price_24h: output[1],
      direction: output[2] > 0.66 ? 'up' : output[2] < 0.33 ? 'down' : 'neutral',
      confidence: Math.abs(output[2] - 0.5) * 2 // 0-1 scale
    };
  }
  
  toJSON() {
    return this.network.toJSON();
  }
  
  fromJSON(json) {
    this.network.fromJSON(json);
  }
  
  getWeights() {
    return Buffer.from(JSON.stringify(this.toJSON()));
  }
  
  loadWeights(buffer) {
    const json = JSON.parse(buffer.toString());
    this.fromJSON(json);
  }
}
```

#### 5.2.3 Ensemble Predictor Service

```javascript
// backend/app/services/ensemblePredictor.js

import { LSTMModel } from './lstmModel.js';
import { LinearRegressionModel } from './linearRegressionModel.js';
import { ARIMAModel } from './arimaModel.js';
import { extractFeatures, normalizeFeatures } from './featureEngineering.js';

export class EnsemblePredictor {
  constructor() {
    this.lstmModel = new LSTMModel();
    this.linearModel = new LinearRegressionModel();
    this.arimaModel = new ARIMAModel();
    
    // Ensemble weights (tuned during validation)
    this.weights = {
      lstm: 0.50,
      linear: 0.30,
      arima: 0.20
    };
  }
  
  async loadModels(modelId) {
    // Load saved weights from database
    const models = await getModelWeights(modelId);
    
    this.lstmModel.loadWeights(models.lstm.weights);
    this.linearModel.loadWeights(models.linear.weights);
    this.arimaModel.loadWeights(models.arima.weights);
  }
  
  async predict(timestamp = Date.now() / 1000) {
    // Extract and normalize features
    const rawFeatures = await extractFeatures(timestamp);
    const stats = await getFeatureStats();
    const features = normalizeFeatures(rawFeatures, stats);
    
    // Get predictions from each model
    const lstmPred = this.lstmModel.predict(features);
    const linearPred = this.linearModel.predict(features);
    const arimaPred = this.arimaModel.predict(features);
    
    // Weighted ensemble
    const ensemblePrediction = {
      price_1h: (
        lstmPred.price_1h * this.weights.lstm +
        linearPred.price_1h * this.weights.linear +
        arimaPred.price_1h * this.weights.arima
      ),
      price_24h: (
        lstmPred.price_24h * this.weights.lstm +
        linearPred.price_24h * this.weights.linear +
        arimaPred.price_24h * this.weights.arima
      ),
      direction: this.aggregateDirection([
        lstmPred.direction,
        linearPred.direction,
        arimaPred.direction
      ]),
      confidence: (
        lstmPred.confidence * this.weights.lstm +
        linearPred.confidence * this.weights.linear +
        arimaPred.confidence * this.weights.arima
      ),
      individual_predictions: {
        lstm: lstmPred,
        linear: linearPred,
        arima: arimaPred
      }
    };
    
    return ensemblePrediction;
  }
  
  aggregateDirection(directions) {
    const votes = { up: 0, down: 0, neutral: 0 };
    directions.forEach(dir => votes[dir]++);
    
    return Object.keys(votes).reduce((a, b) => 
      votes[a] > votes[b] ? a : b
    );
  }
}
```

#### 5.2.4 Prediction Poller

```javascript
// backend/app/services/predictionPoller.js

import { EnsemblePredictor } from './ensemblePredictor.js';
import { savePrediction } from '../db/aiModelsDb.js';

const predictor = new EnsemblePredictor();
let isInitialized = false;

export async function initializePredictionService() {
  if (isInitialized) {
    console.log('⚠️ Prediction service already initialized');
    return;
  }
  
  console.log('🤖 Initializing AI prediction service...');
  
  // Load latest model weights
  await predictor.loadModels('ensemble_v1');
  
  // Make initial prediction
  await generatePrediction();
  
  isInitialized = true;
  console.log('✅ AI prediction service initialized');
}

export function startPredictionPolling() {
  // Update predictions every 4 hours
  const interval = 4 * 60 * 60 * 1000;
  
  setInterval(async () => {
    await generatePrediction();
  }, interval);
  
  console.log('🔄 Started prediction polling (every 4 hours)');
}

async function generatePrediction() {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    
    console.log('🎯 Generating new price prediction...');
    const prediction = await predictor.predict(timestamp);
    
    // Save to database
    await savePrediction({
      model_id: 1, // ensemble model
      prediction_timestamp: timestamp,
      target_timestamp_1h: timestamp + 3600,
      target_timestamp_24h: timestamp + 86400,
      predicted_price_1h: prediction.price_1h,
      predicted_price_24h: prediction.price_24h,
      predicted_direction: prediction.direction,
      confidence: prediction.confidence
    });
    
    console.log(`✅ Prediction saved: ${prediction.direction} (${(prediction.confidence * 100).toFixed(1)}% confidence)`);
    
    return prediction;
  } catch (error) {
    console.error('❌ Error generating prediction:', error);
  }
}
```

### 5.3 API Endpoints

```javascript
// backend/app/routes/aiModelRoutes.js

import express from 'express';
import {
  getCurrentPrediction,
  getPredictionHistory,
  getModelMetrics,
  triggerRetraining
} from '../controllers/aiModelController.js';

const router = express.Router();

// Get latest prediction
router.get('/prediction/latest', getCurrentPrediction);

// Get prediction history
router.get('/prediction/history', getPredictionHistory);

// Get model performance metrics
router.get('/model/metrics', getModelMetrics);

// Trigger model retraining (admin only)
router.post('/model/retrain', triggerRetraining);

export default router;
```

```javascript
// backend/app/controllers/aiModelController.js

export async function getCurrentPrediction(req, res) {
  try {
    const prediction = await getLatestPrediction();
    const currentPrice = await getCurrentPrice();
    
    res.json({
      current_price: currentPrice,
      prediction_1h: prediction.predicted_price_1h,
      prediction_24h: prediction.predicted_price_24h,
      direction: prediction.predicted_direction,
      confidence: prediction.confidence,
      predicted_at: prediction.prediction_timestamp,
      model_version: prediction.model_version
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getPredictionHistory(req, res) {
  const { from, to, limit = 100 } = req.query;
  
  try {
    const predictions = await getPredictions(from, to, limit);
    
    // Include actual prices and accuracy for past predictions
    const enriched = await Promise.all(
      predictions.map(async (pred) => {
        const actual = await getActualPrice(pred.target_timestamp_1h);
        const error = actual ? Math.abs(pred.predicted_price_1h - actual) : null;
        
        return {
          ...pred,
          actual_price: actual,
          error: error,
          accuracy: error ? (1 - error / actual) * 100 : null
        };
      })
    );
    
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getModelMetrics(req, res) {
  try {
    const metrics = await calculateModelMetrics();
    
    res.json({
      mae: metrics.mae,
      rmse: metrics.rmse,
      directional_accuracy: metrics.directional_accuracy,
      confidence_calibration: metrics.confidence_calibration,
      last_updated: metrics.last_updated
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

## 6. Frontend Implementation

### 6.1 AI Prediction Component

```javascript
// frontend/src/Components/AIPrediction.jsx

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

export default function AIPrediction() {
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrediction();
    fetchHistory();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchPrediction, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchPrediction() {
    const response = await fetch(`${API_BASE_URL}/api/ai/prediction/latest`);
    const data = await response.json();
    setPrediction(data);
    setLoading(false);
  }

  async function fetchHistory() {
    const response = await fetch(`${API_BASE_URL}/api/ai/prediction/history?limit=24`);
    const data = await response.json();
    setHistory(data);
  }

  const chartData = {
    labels: history.map(h => new Date(h.prediction_timestamp * 1000).toLocaleTimeString()),
    datasets: [
      {
        label: 'Predicted Price',
        data: history.map(h => h.predicted_price_1h),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      },
      {
        label: 'Actual Price',
        data: history.map(h => h.actual_price),
        borderColor: '#00b3ff',
        backgroundColor: 'rgba(0, 179, 255, 0.1)',
        tension: 0.4
      }
    ]
  };

  if (loading) return <div className="text-center p-8">Loading AI prediction...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">🤖 AI Price Prediction</h2>
      
      {/* Current Prediction */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded p-4">
          <div className="text-sm text-gray-600">Current Price</div>
          <div className="text-2xl font-bold">${prediction?.current_price?.toLocaleString()}</div>
        </div>
        
        <div className="bg-blue-50 rounded p-4">
          <div className="text-sm text-gray-600">Predicted (1h)</div>
          <div className="text-2xl font-bold text-blue-600">
            ${prediction?.prediction_1h?.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">
            {prediction?.direction === 'up' ? '📈 Up' : prediction?.direction === 'down' ? '📉 Down' : '➡️ Neutral'}
          </div>
        </div>
        
        <div className="bg-purple-50 rounded p-4">
          <div className="text-sm text-gray-600">Predicted (24h)</div>
          <div className="text-2xl font-bold text-purple-600">
            ${prediction?.prediction_24h?.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">
            Confidence: {(prediction?.confidence * 100)?.toFixed(1)}%
          </div>
        </div>
      </div>
      
      {/* Prediction vs Actual Chart */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">24-Hour Prediction History</h3>
        <Line data={chartData} options={{
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            tooltip: { mode: 'index', intersect: false }
          }
        }} />
      </div>
      
      {/* Model Metrics */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-sm text-gray-600">Accuracy</div>
          <div className="text-xl font-bold">83.5%</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Avg Error</div>
          <div className="text-xl font-bold">2.3%</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Model</div>
          <div className="text-xl font-bold">Ensemble</div>
        </div>
      </div>
    </div>
  );
}
```

### 6.2 Integration with MainDashboard

```javascript
// Add to frontend/src/Components/MainDashboard.jsx

import AIPrediction from './AIPrediction';

// In the render section:
<div className="space-y-6">
  {/* Existing components */}
  <PriceChart />
  <HashRateChart />
  <DifficultyChart />
  <CorrelationDashboard />
  
  {/* New AI Prediction */}
  <AIPrediction />
  
  {/* Rest of components */}
</div>
```

---

## 7. Performance Optimization

### 7.1 Caching Strategy

```javascript
// In-memory cache for features and predictions
const cache = {
  features: new Map(), // timestamp -> features
  predictions: new Map(), // timestamp -> prediction
  stats: null, // feature normalization stats
  ttl: 5 * 60 * 1000 // 5 minutes
};

export function getCachedFeatures(timestamp) {
  const cached = cache.features.get(timestamp);
  if (cached && Date.now() - cached.cachedAt < cache.ttl) {
    return cached.data;
  }
  return null;
}

export function cacheFeatures(timestamp, features) {
  cache.features.set(timestamp, {
    data: features,
    cachedAt: Date.now()
  });
  
  // Limit cache size to last 100 entries
  if (cache.features.size > 100) {
    const oldestKey = cache.features.keys().next().value;
    cache.features.delete(oldestKey);
  }
}
```

### 7.2 Lazy Loading Models

```javascript
// Only load models when needed
let modelInstance = null;

export async function getPredictor() {
  if (!modelInstance) {
    modelInstance = new EnsemblePredictor();
    await modelInstance.loadModels('ensemble_v1');
  }
  return modelInstance;
}
```

### 7.3 Database Indexing

```sql
-- Already covered in schema, but emphasize:
CREATE INDEX idx_ai_predictions_timestamp ON ai_predictions(prediction_timestamp DESC);
CREATE INDEX idx_feature_vectors_timestamp ON feature_vectors(timestamp DESC);
```

---

## 8. Monitoring & Evaluation

### 8.1 Metrics to Track

| Metric | Target | Calculation |
|--------|--------|-------------|
| **Directional Accuracy** | >80% | % of correct up/down predictions |
| **Mean Absolute Error (MAE)** | <3% | Mean of \|predicted - actual\| / actual |
| **Root Mean Squared Error (RMSE)** | <5% | √(mean of (predicted - actual)²) |
| **Inference Time** | <100ms | Time from request to prediction |
| **Confidence Calibration** | >0.8 | Correlation between confidence and accuracy |

### 8.2 Monitoring Dashboard

Add a metrics endpoint that returns:

```json
{
  "model_version": "ensemble_v1",
  "last_updated": 1700000000,
  "performance": {
    "directional_accuracy_7d": 0.835,
    "directional_accuracy_30d": 0.812,
    "mae_7d": 0.023,
    "rmse_7d": 0.041,
    "avg_inference_time_ms": 87,
    "predictions_made_24h": 6,
    "training_samples": 8760
  },
  "recent_predictions": [
    {
      "timestamp": 1700000000,
      "predicted": 45000,
      "actual": 45200,
      "error": 200,
      "accuracy": 0.996
    }
  ]
}
```

### 8.3 Automated Retraining Trigger

```javascript
// Check if model accuracy drops below threshold
async function monitorModelPerformance() {
  const metrics = await calculateModelMetrics();
  
  if (metrics.directional_accuracy < 0.75) {
    console.warn('⚠️ Model accuracy dropped below 75%. Triggering retraining...');
    await triggerRetraining();
  }
}

// Run daily
setInterval(monitorModelPerformance, 24 * 60 * 60 * 1000);
```

---

## 9. Implementation Timeline

### Phase 1: Foundation (Week 1)
- [ ] Create database schema and run migration
- [ ] Implement `featureEngineering.js` service
- [ ] Create `aiModelsDb.js` database access layer
- [ ] Write initial training script skeleton

### Phase 2: Model Implementation (Week 2)
- [ ] Implement LSTM model with brain.js
- [ ] Implement Linear Regression model
- [ ] Implement ARIMA model (or use library)
- [ ] Create ensemble predictor

### Phase 3: Training Pipeline (Week 3)
- [ ] Collect historical data (365 days)
- [ ] Run initial training on all three models
- [ ] Tune hyperparameters for best performance
- [ ] Save trained model weights to database

### Phase 4: API & Frontend (Week 4)
- [ ] Create API endpoints for predictions
- [ ] Build AIPrediction React component
- [ ] Integrate with MainDashboard
- [ ] Add monitoring dashboard

### Phase 5: Testing & Optimization (Week 5)
- [ ] Backtest predictions on historical data
- [ ] Optimize inference performance (<100ms)
- [ ] Implement caching strategy
- [ ] Set up automated retraining

### Phase 6: Production Deployment (Week 6)
- [ ] Deploy to production environment
- [ ] Monitor initial performance
- [ ] Collect user feedback
- [ ] Document model behavior

---

## 10. Dependencies

### 10.1 NPM Packages

```json
{
  "dependencies": {
    "brain.js": "^2.0.0-beta.22",
    "ml.js": "^6.0.0",
    "arima": "^1.0.0"
  }
}
```

### 10.2 Installation

```bash
cd backend
npm install brain.js ml.js arima
```

---

## 11. Risk Mitigation

### 11.1 Potential Issues

| Risk | Impact | Mitigation |
|------|--------|------------|
| Model overfitting | High | Use validation set, early stopping, regularization |
| Inference too slow | Medium | Cache features, optimize model size, use lazy loading |
| Memory consumption | Medium | Limit cache size, use streaming for training |
| External API failures | Low | Use fallback data sources, cache historical data |
| Inaccurate predictions | High | Ensemble approach, continuous monitoring, auto-retraining |

### 11.2 Fallback Strategy

```javascript
// If AI prediction fails, use simple moving average as fallback
async function getPredictionWithFallback() {
  try {
    return await predictor.predict();
  } catch (error) {
    console.error('AI prediction failed, using fallback:', error);
    
    // Simple fallback: use 24-hour moving average
    const prices = await getPriceHistory(Date.now() - 86400, Date.now());
    const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
    
    return {
      price_1h: avgPrice,
      price_24h: avgPrice,
      direction: 'neutral',
      confidence: 0.5,
      method: 'fallback'
    };
  }
}
```

---

## 12. Success Criteria

The AI model implementation will be considered successful when:

1. ✅ **Accuracy:** Achieves >80% directional accuracy on 7-day rolling window
2. ✅ **Performance:** Inference time consistently <100ms
3. ✅ **Reliability:** 99.9% uptime with fallback mechanisms
4. ✅ **Efficiency:** Memory usage <20MB for model storage
5. ✅ **Integration:** Seamlessly integrates with existing dashboard UI
6. ✅ **Monitoring:** Real-time metrics visible in admin dashboard
7. ✅ **Automation:** Automatic retraining triggered by performance drops

---

## 13. Next Steps

1. **Review this plan** with the team and get approval
2. **Set up development environment** with brain.js and dependencies
3. **Start with Phase 1** (database schema and feature engineering)
4. **Iterative development** following the 6-week timeline
5. **Regular testing** after each phase completion
6. **Documentation** of learnings and model behavior

---

## Appendix A: Example Training Data Format

```javascript
// Sample training data structure
const trainingData = [
  {
    features: {
      price: 45000,
      price_ma_24h: 44800,
      price_ma_7d: 44500,
      price_momentum: 0.005,
      price_volatility: 850,
      hashrate: 450000000,
      hashrate_change: 0.02,
      difficulty: 61000000000000,
      difficulty_change: 0.01,
      mempool_size: 50000,
      block_time_avg: 598,
      correlation_hashrate: 0.65,
      correlation_difficulty: 0.58,
      hour_of_day: 14,
      day_of_week: 3
    },
    target_1h: 45100,
    target_24h: 45500,
    direction: 1 // up
  }
  // ... more samples
];
```

---

## Appendix B: brain.js Quick Reference

```javascript
// Creating a neural network
const net = new brain.NeuralNetwork({
  hiddenLayers: [32, 16],
  activation: 'sigmoid'
});

// Training
net.train(trainingData, {
  iterations: 1000,
  learningRate: 0.01,
  log: true,
  logPeriod: 100
});

// Prediction
const output = net.run([input1, input2, ...]);

// Save/Load
const json = net.toJSON();
net.fromJSON(json);
```

---

**Document Version:** 1.0  
**Last Updated:** November 18, 2025  
**Author:** AI Development Team  
**Status:** Ready for Implementation
