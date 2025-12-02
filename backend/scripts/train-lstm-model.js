#!/usr/bin/env node

/**
 * Train LSTM Model for Bitcoin Price Prediction
 * 
 * Architecture:
 * - Input: [60 timesteps, 10 features]
 * - Bidirectional LSTM (50 units) + Dropout (0.2)
 * - Bidirectional LSTM (25 units) + Dropout (0.2)
 * - Dense (16 units, ReLU)
 * - Dense (1 unit, Linear) → Price change prediction
 * 
 * Usage: node scripts/train-lstm-model.js
 */

import dotenv from 'dotenv';
dotenv.config();

import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Training hyperparameters
const EPOCHS = 100;
const BATCH_SIZE = 32;
const LEARNING_RATE = 0.001;
const EARLY_STOPPING_PATIENCE = 10;

async function loadDataset(filename) {
  const filePath = path.join(__dirname, '../models', filename);
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

async function trainModel() {
  console.log('🧠 Starting LSTM model training...\n');
  console.log('📊 Configuration:');
  console.log(`   Epochs: ${EPOCHS}`);
  console.log(`   Batch size: ${BATCH_SIZE}`);
  console.log(`   Learning rate: ${LEARNING_RATE}`);
  console.log(`   Early stopping patience: ${EARLY_STOPPING_PATIENCE}\n`);
  
  // Load datasets
  console.log('📂 Loading datasets...');
  const trainData = await loadDataset('train-dataset.json');
  const valData = await loadDataset('val-dataset.json');
  const testData = await loadDataset('test-dataset.json');
  
  console.log(`   Training: ${trainData.length} samples`);
  console.log(`   Validation: ${valData.length} samples`);
  console.log(`   Test: ${testData.length} samples\n`);
  
  // Convert to tensors
  console.log('🔄 Converting to tensors...');
  
  const trainX = tf.tensor3d(trainData.map(s => s.features));
  const trainY = tf.tensor2d(trainData.map(s => [s.target]));
  
  const valX = tf.tensor3d(valData.map(s => s.features));
  const valY = tf.tensor2d(valData.map(s => [s.target]));
  
  console.log(`   Training X shape: [${trainX.shape}]`);
  console.log(`   Training Y shape: [${trainY.shape}]\n`);
  
  // Build model
  console.log('🏗️  Building LSTM model...');
  
  const model = tf.sequential({
    layers: [
      // First Bidirectional LSTM layer
      tf.layers.bidirectional({
        layer: tf.layers.lstm({ 
          units: 50, 
          returnSequences: true,
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
        }),
        inputShape: [60, 10]
      }),
      tf.layers.dropout({ rate: 0.2 }),
      
      // Second Bidirectional LSTM layer
      tf.layers.bidirectional({
        layer: tf.layers.lstm({ 
          units: 25, 
          returnSequences: false,
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
        })
      }),
      tf.layers.dropout({ rate: 0.2 }),
      
      // Dense layers
      tf.layers.dense({ units: 16, activation: 'relu' }),
      tf.layers.dropout({ rate: 0.1 }),
      
      // Output layer (predicts price change %)
      tf.layers.dense({ units: 1 })
    ]
  });
  
  model.compile({
    optimizer: tf.train.adam(LEARNING_RATE),
    loss: 'meanSquaredError',
    metrics: ['mae', 'mape']
  });
  
  model.summary();
  console.log();
  
  // Training callbacks
  let bestValLoss = Infinity;
  let patienceCounter = 0;
  
  const callbacks = {
    onEpochEnd: async (epoch, logs) => {
      const trainLoss = logs.loss.toFixed(6);
      const valLoss = logs.val_loss.toFixed(6);
      const trainMAE = logs.mae.toFixed(6);
      const valMAE = logs.val_mae.toFixed(6);
      
      console.log(
        `Epoch ${(epoch + 1).toString().padStart(3)}/${EPOCHS} - ` +
        `loss: ${trainLoss} - mae: ${trainMAE} - ` +
        `val_loss: ${valLoss} - val_mae: ${valMAE}`
      );
      
      // Early stopping logic
      if (logs.val_loss < bestValLoss) {
        bestValLoss = logs.val_loss;
        patienceCounter = 0;
        
        // Save best model
        await model.save(`file://${path.join(__dirname, '../models/lstm-btc-best')}`);
        console.log(`   💾 Best model saved (val_loss: ${valLoss})`);
      } else {
        patienceCounter++;
        if (patienceCounter >= EARLY_STOPPING_PATIENCE) {
          console.log(`\n⏹️  Early stopping triggered (patience: ${EARLY_STOPPING_PATIENCE})`);
          model.stopTraining = true;
        }
      }
    }
  };
  
  // Train
  console.log('🚀 Starting training...\n');
  
  const startTime = Date.now();
  
  await model.fit(trainX, trainY, {
    epochs: EPOCHS,
    batchSize: BATCH_SIZE,
    validationData: [valX, valY],
    callbacks: callbacks,
    shuffle: true
  });
  
  const trainingTime = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
  console.log(`\n⏱️  Training completed in ${trainingTime} minutes\n`);
  
  // Evaluate on test set
  console.log('📊 Evaluating on test set...');
  
  const testX = tf.tensor3d(testData.map(s => s.features));
  const testY = tf.tensor2d(testData.map(s => [s.target]));
  
  const evalResults = model.evaluate(testX, testY);
  const testLoss = await evalResults[0].data();
  const testMAE = await evalResults[1].data();
  const testMAPE = await evalResults[2].data();
  
  console.log(`\n📈 Test Results:`);
  console.log(`   Loss (MSE): ${testLoss[0].toFixed(6)}`);
  console.log(`   MAE: ${testMAE[0].toFixed(6)} (${(testMAE[0] * 100).toFixed(3)}%)`);
  console.log(`   MAPE: ${testMAPE[0].toFixed(2)}%`);
  
  // Calculate directional accuracy
  const predictions = model.predict(testX);
  const predValues = await predictions.data();
  const actualValues = await testY.data();
  
  let correctDirection = 0;
  for (let i = 0; i < predValues.length; i++) {
    const predDir = predValues[i] > 0;
    const actualDir = actualValues[i] > 0;
    if (predDir === actualDir) correctDirection++;
  }
  
  const directionalAccuracy = (correctDirection / predValues.length) * 100;
  console.log(`   Directional Accuracy: ${directionalAccuracy.toFixed(2)}%`);
  
  // Save final model
  console.log('\n💾 Saving final model...');
  await model.save(`file://${path.join(__dirname, '../models/lstm-btc-final')}`);
  
  // Save training metadata
  const metadata = {
    trainedAt: new Date().toISOString(),
    trainingTime: `${trainingTime} minutes`,
    dataset: {
      train: trainData.length,
      validation: valData.length,
      test: testData.length
    },
    hyperparameters: {
      epochs: EPOCHS,
      batchSize: BATCH_SIZE,
      learningRate: LEARNING_RATE,
      architecture: 'Bidirectional LSTM (50+25 units)'
    },
    performance: {
      testLoss: testLoss[0],
      testMAE: testMAE[0],
      testMAPE: testMAPE[0],
      directionalAccuracy: directionalAccuracy,
      bestValLoss: bestValLoss
    }
  };
  
  await fs.writeFile(
    path.join(__dirname, '../models/training-metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  console.log('✅ Training metadata saved\n');
  
  // Clean up
  tf.dispose([trainX, trainY, valX, valY, testX, testY, predictions, evalResults]);
  
  console.log('🎉 Training complete!\n');
  console.log('📁 Model files saved to: backend/models/');
  console.log('   - lstm-btc-best/     (best validation loss)');
  console.log('   - lstm-btc-final/    (final epoch)');
  console.log('   - feature-stats.json (normalization stats)');
  console.log('   - training-metadata.json (performance metrics)\n');
  
  // Performance assessment
  if (testMAE[0] < 0.03 && directionalAccuracy > 60) {
    console.log('✅ Model meets performance targets!');
    console.log('   ✓ MAE < 3%');
    console.log('   ✓ Directional accuracy > 60%\n');
  } else {
    console.log('⚠️  Model performance below targets:');
    if (testMAE[0] >= 0.03) {
      console.log(`   ✗ MAE: ${(testMAE[0] * 100).toFixed(3)}% (target < 3%)`);
    }
    if (directionalAccuracy <= 60) {
      console.log(`   ✗ Directional accuracy: ${directionalAccuracy.toFixed(2)}% (target > 60%)`);
    }
    console.log('\n💡 Consider: more training data, hyperparameter tuning, or feature engineering\n');
  }
}

trainModel().catch(err => {
  console.error('❌ Training failed:', err);
  console.error(err.stack);
  process.exit(1);
});
