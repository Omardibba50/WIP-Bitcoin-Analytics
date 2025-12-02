#!/usr/bin/env node

/**
 * Build Training Dataset for LSTM Model
 * 
 * Creates training/validation/test datasets with:
 * - 60 timesteps of features (lookback window)
 * - Target: next hour price
 * - Train/Val/Test split: 70/15/15
 * 
 * Usage: node scripts/build-training-dataset.js
 */

import dotenv from 'dotenv';
dotenv.config();

import { FeatureStore } from '../app/services/featureStore.js';
import { getHistory } from '../app/db/pricesDb.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LOOKBACK = 60; // 60 hours lookback
const HORIZON = 1;   // Predict 1 hour ahead

async function buildDataset() {
  console.log('🏗️  Building LSTM training dataset...\n');
  
  // Initialize feature store
  const featureStore = new FeatureStore();
  await featureStore.computeStats('BTC');
  
  // Get all historical price data
  const now = Date.now();
  const startTime = now - (365 * 24 * 60 * 60 * 1000); // 1 year
  
  console.log('📊 Fetching price data...');
  const prices = await getHistory('BTC', startTime, now, 10000);
  console.log(`   Found ${prices.length} price records\n`);
  
  if (prices.length < LOOKBACK + HORIZON + 100) {
    throw new Error(`Insufficient data: need at least ${LOOKBACK + HORIZON + 100} records, got ${prices.length}`);
  }
  
  // Build dataset
  console.log('🔨 Computing features for each sample...');
  const dataset = [];
  let processed = 0;
  let skipped = 0;
  
  // Start from LOOKBACK and go until we have enough data for target
  for (let i = LOOKBACK; i < prices.length - HORIZON; i++) {
    try {
      const currentTimestamp = prices[i].ts;
      
      // Compute 60 timesteps of features
      const features = await featureStore.computeFeatures('BTC', currentTimestamp, LOOKBACK);
      
      // Target: price at i + HORIZON
      const targetPrice = prices[i + HORIZON].price;
      const currentPrice = prices[i].price;
      
      // Store as percentage change (easier to learn than absolute prices)
      const targetChange = (targetPrice - currentPrice) / currentPrice;
      
      dataset.push({
        features: features.map(f => [
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
        ]),
        target: targetChange,
        timestamp: currentTimestamp,
        currentPrice: currentPrice,
        targetPrice: targetPrice
      });
      
      processed++;
      
      if (processed % 500 === 0) {
        console.log(`   Processed ${processed} samples...`);
      }
      
    } catch (err) {
      skipped++;
      if (skipped < 5) {
        console.warn(`   ⚠️  Skipped sample at index ${i}: ${err.message}`);
      }
    }
  }
  
  console.log(`\n✅ Dataset built: ${dataset.length} samples (${skipped} skipped)\n`);
  
  // Shuffle dataset
  console.log('🔀 Shuffling dataset...');
  for (let i = dataset.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dataset[i], dataset[j]] = [dataset[j], dataset[i]];
  }
  
  // Split into train/val/test (70/15/15)
  const trainSize = Math.floor(dataset.length * 0.70);
  const valSize = Math.floor(dataset.length * 0.15);
  
  const trainSet = dataset.slice(0, trainSize);
  const valSet = dataset.slice(trainSize, trainSize + valSize);
  const testSet = dataset.slice(trainSize + valSize);
  
  console.log('📊 Dataset split:');
  console.log(`   Training:   ${trainSet.length} samples (70%)`);
  console.log(`   Validation: ${valSet.length} samples (15%)`);
  console.log(`   Test:       ${testSet.length} samples (15%)`);
  
  // Save to disk
  const modelsDir = path.join(__dirname, '../models');
  await fs.mkdir(modelsDir, { recursive: true });
  
  console.log('\n💾 Saving datasets...');
  
  await fs.writeFile(
    path.join(modelsDir, 'train-dataset.json'),
    JSON.stringify(trainSet, null, 0)
  );
  console.log('   ✅ train-dataset.json saved');
  
  await fs.writeFile(
    path.join(modelsDir, 'val-dataset.json'),
    JSON.stringify(valSet, null, 0)
  );
  console.log('   ✅ val-dataset.json saved');
  
  await fs.writeFile(
    path.join(modelsDir, 'test-dataset.json'),
    JSON.stringify(testSet, null, 0)
  );
  console.log('   ✅ test-dataset.json saved');
  
  // Save feature statistics
  await featureStore.saveStats(path.join(modelsDir, 'feature-stats.json'));
  
  // Print summary statistics
  console.log('\n📈 Dataset Statistics:');
  const targets = trainSet.map(s => s.target);
  const avgChange = targets.reduce((a, b) => a + b, 0) / targets.length;
  const maxChange = Math.max(...targets);
  const minChange = Math.min(...targets);
  
  console.log(`   Average price change: ${(avgChange * 100).toFixed(4)}%`);
  console.log(`   Max price change: ${(maxChange * 100).toFixed(2)}%`);
  console.log(`   Min price change: ${(minChange * 100).toFixed(2)}%`);
  
  console.log('\n✅ Dataset build complete! Ready for training.\n');
}

buildDataset().catch(err => {
  console.error('❌ Error building dataset:', err);
  console.error(err.stack);
  process.exit(1);
});
