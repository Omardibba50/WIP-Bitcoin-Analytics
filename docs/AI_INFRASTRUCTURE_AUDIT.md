# Bitcoin AI Price Prediction - Infrastructure Audit & Revised Plan

**Date:** November 28, 2025  
**Status:** Infrastructure Review Complete  
**Priority:** Fix data issues FIRST, then build AI model

---

## 🔍 CRITICAL FINDINGS

### Issue #1: Database Path Mismatch ⚠️
**Problem:** Your codebase has **TWO separate databases** that don't talk to each other:

1. **Main Application DB:** `/backend/data/prices.sqlite`
   - Used by: `server.js`, all routes, pollers
   - Path: Set in `backend/db.js` via `initDb(path.join(process.cwd(), "data", "prices.sqlite"))`
   - Current data: 164 price rows (test data)

2. **Backfill Script DB:** `/backend/scripts/prices.db`
   - Used by: `scripts/backfill-prices.js`
   - Path: Hardcoded in `backend/scripts/db.js` as `new Database('prices.db')`
   - Just inserted: 366 rows that are NOT in your main DB!

**Impact:** When you run the backfill script, it writes to `scripts/prices.db` but your server reads from `data/prices.sqlite`. This is why you only have 164 rows (old test data) instead of thousands.

### Issue #2: Polling Services NOT Running Consistently
**Current Status:**
- `startBlockPolling()` - ✅ Running (every 60 seconds)
- `startHashratePolling()` - ✅ Running (every 1 hour)
- `startDifficultyPolling()` - ✅ Running (every 1 hour)
- **Price polling** - ❌ **NOT IMPLEMENTED**

**Problem:** No automatic price updates! You have pollers for hashrate/difficulty but NOT for prices.

### Issue #3: Insufficient Training Data
Even after fixing the DB path, current data volumes are:
- Prices: 164 rows → Need 8,760+ (1 year hourly)
- Hashrate: 361 rows → OK for now
- Difficulty: 361 rows → OK for now

---

## 🛠️ PHASE 0: Fix Infrastructure (MUST DO FIRST)

### Step 1: Fix Database Path Mismatch

**File:** `backend/scripts/db.js`

**Current (BROKEN):**
```javascript
export function initDb() {
  if (!db) {
    db = new Database('prices.db'); // WRONG PATH!
```

**Fix:**
```javascript
import path from 'path';
import fs from 'fs';

export function initDb() {
  if (!db) {
    // Use same path as main app
    const dbPath = path.join(process.cwd(), 'data', 'prices.sqlite');
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    db = new Database(dbPath);
    // ... rest of setup
```

### Step 2: Implement Price Polling Service

**File:** `backend/app/services/pricePoller.js` (CREATE NEW)

```javascript
// Automatic price polling to keep database updated
import { insertPrice, getLatestPrice } from '../db/pricesDb.js';

let pollingInterval = null;
const POLL_INTERVAL = 5 * 60 * 1000; // Poll every 5 minutes

export function startPricePolling() {
  if (pollingInterval) {
    console.log('⚠️  Price polling already running');
    return;
  }

  console.log('🔄 Starting automatic BTC price polling...');
  
  // Initial fetch
  pollPrice();
  
  // Set up interval
  pollingInterval = setInterval(pollPrice, POLL_INTERVAL);
}

export function stopPricePolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('⏹️  Price polling stopped');
  }
}

async function pollPrice() {
  try {
    // Use CoinGecko API (same as existing code)
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';
    
    const headers = {};
    if (process.env.COINGECKO_API_KEY) {
      headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`CoinGecko returned status: ${response.status}`);
    }
    
    const data = await response.json();
    const price = data?.bitcoin?.usd;
    
    if (!price) {
      throw new Error('No price data from CoinGecko');
    }
    
    const now = Date.now();
    
    try {
      insertPrice('BTC', price, now, 'coingecko');
      console.log(`✅ Updated BTC price: $${price.toLocaleString()}`);
    } catch (err) {
      if (!err.message.includes('UNIQUE constraint')) {
        throw err;
      }
    }
    
  } catch (error) {
    console.error('❌ Error polling price:', error.message);
  }
}
```

### Step 3: Wire Up Price Poller in Server

**File:** `backend/server.js`

```javascript
// Add import
import { startPricePolling } from "./app/services/pricePoller.js";

// Add to background processes section
startPricePolling(); // Add this line after other pollers
```

### Step 4: Re-run Backfill with Fixed DB Path

```bash
cd backend
# After fixing scripts/db.js path
node scripts/backfill-prices.js BTC 730  # 2 years of data
```

This will populate `data/prices.sqlite` with 17,520 hourly price records.

---

## 📊 REVISED AI IMPLEMENTATION PLAN

### Architecture: Work with YOUR Infrastructure

```
┌────────────────────────────────────────────────┐
│         EXISTING INFRASTRUCTURE                │
│  (Already working, don't break it!)            │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────┐    ┌──────────────┐        │
│  │  CoinGecko   │    │ Blockchain   │        │
│  │     API      │    │   .info      │        │
│  └──────┬───────┘    └──────┬───────┘        │
│         │                   │                 │
│         ▼                   ▼                 │
│  ┌──────────────────────────────────┐        │
│  │   Polling Services (Fixed)       │        │
│  │  - pricePoller (5 min)          │        │
│  │  - hashratePoller (1 hour)      │        │
│  │  - difficultyPoller (1 hour)    │        │
│  └──────────────┬───────────────────┘        │
│                 │                             │
│                 ▼                             │
│  ┌──────────────────────────────────┐        │
│  │   SQLite: data/prices.sqlite     │        │
│  │  - prices (17,520 rows)          │        │
│  │  - hashrate_history (8,760)      │        │
│  │  - difficulty_history (8,760)    │        │
│  └──────────────┬───────────────────┘        │
│                 │                             │
└─────────────────┼─────────────────────────────┘
                  │
                  │ YOUR EXISTING DB QUERIES
                  ▼
┌────────────────────────────────────────────────┐
│         NEW: AI PREDICTION LAYER               │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────────────────────────┐        │
│  │   Feature Engineering Service    │        │
│  │  Uses: getHistory(), etc.        │        │
│  └──────────────┬───────────────────┘        │
│                 │                             │
│                 ▼                             │
│  ┌──────────────────────────────────┐        │
│  │   TensorFlow.js LSTM Model       │        │
│  │  Input: 60 timesteps × 10 feats │        │
│  │  Output: Next hour price        │        │
│  └──────────────┬───────────────────┘        │
│                 │                             │
│                 ▼                             │
│  ┌──────────────────────────────────┐        │
│  │   Prediction Storage             │        │
│  │  Uses: insertPrediction()        │        │
│  └──────────────────────────────────┘        │
│                                                │
└────────────────────────────────────────────────┘
```

### Simplified Feature Set (10 features, not 15)

Working with YOUR actual data:

1. **Price features (5)** - from `getHistory('BTC', from, to, limit)`
   - log_return_1h
   - log_return_24h
   - volatility_24h (rolling std)
   - sma_24h (simple moving average)
   - rsi_14 (relative strength index)

2. **On-chain features (3)** - from `getHashrateHistory()` and `getDifficultyHistory()`
   - hashrate_normalized
   - difficulty_normalized
   - hashrate_change_24h

3. **Temporal features (2)**
   - hour_sin (daily seasonality)
   - day_cos (weekly seasonality)

**Why simpler?**
- Works with your ACTUAL database queries
- No mempool (not consistently polled)
- No complex correlations (can add later)
- Faster training (10 vs 15 features)

### Model: Lightweight LSTM (NOT Bidirectional)

```javascript
// Simpler architecture for faster training
const model = tf.sequential({
  layers: [
    tf.layers.lstm({ 
      units: 50, 
      returnSequences: true, 
      inputShape: [60, 10] 
    }),
    tf.layers.dropout({ rate: 0.2 }),
    tf.layers.lstm({ 
      units: 25, 
      returnSequences: false 
    }),
    tf.layers.dropout({ rate: 0.2 }),
    tf.layers.dense({ units: 1 }) // Single price prediction
  ]
});

model.compile({
  optimizer: tf.train.adam(0.001),
  loss: 'meanSquaredError',
  metrics: ['mae']
});
```

**Why simpler?**
- Trains in 5-10 minutes (not 30)
- Less memory (<10MB model)
- Easier to debug
- Good enough for start

---

## 🎯 IMPLEMENTATION CHECKLIST

### Week 1: Fix Infrastructure ✅
- [ ] Day 1: Fix `scripts/db.js` database path
- [ ] Day 1: Create `pricePoller.js` service
- [ ] Day 1: Wire up price poller in `server.js`
- [ ] Day 2: Run backfill script to get 2 years of price data
- [ ] Day 2: Run hashrate/difficulty backfill for same period
- [ ] Day 3: Verify all pollers running correctly
- [ ] Day 3: Confirm database has 17,000+ price records

**Deliverable:** Database with sufficient training data

### Week 2: Build AI Model
- [ ] Day 1: Install TensorFlow.js (`npm install @tensorflow/tfjs-node`)
- [ ] Day 1: Create `backend/app/services/featureStore.js`
- [ ] Day 2: Implement 10 feature calculations using YOUR DB queries
- [ ] Day 2: Create `backend/scripts/build-dataset.js`
- [ ] Day 3: Create `backend/scripts/train-model.js`
- [ ] Day 4: Train model (target: MAE < $3,000)
- [ ] Day 5: Save trained model to `backend/models/lstm-btc-1h/`

**Deliverable:** Trained model with acceptable accuracy

### Week 3: Integration
- [ ] Day 1: Create `backend/app/services/aiPredictionService.js`
- [ ] Day 1: Load trained model on server startup
- [ ] Day 2: Create hourly prediction poller
- [ ] Day 2: Store predictions in database
- [ ] Day 3: Create API endpoint `/api/ai/predictions/latest`
- [ ] Day 4: Test end-to-end prediction flow
- [ ] Day 5: Add basic error handling and logging

**Deliverable:** Live AI predictions in production

---

## 📝 NEXT IMMEDIATE STEPS

1. **Review this plan** - Is this approach acceptable?

2. **Fix database path** - I can make the change to `scripts/db.js`

3. **Create price poller** - I can write `app/services/pricePoller.js`

4. **Run backfill** - You run: `node scripts/backfill-prices.js BTC 730`

5. **Verify data** - Confirm you have 17,000+ rows

6. **Then proceed** to AI model implementation

---

## ⚠️ WHY THIS PLAN IS BETTER

### Old Plan Issues:
- ❌ Didn't check actual database state
- ❌ Assumed backfill script worked correctly
- ❌ Proposed 15 features (some unavailable)
- ❌ Complex bidirectional LSTM (slow training)
- ❌ Didn't identify missing price poller

### New Plan Advantages:
- ✅ Fixes actual infrastructure problems FIRST
- ✅ Uses YOUR existing database queries
- ✅ Simpler feature set (10 features)
- ✅ Faster model (5-10 min training)
- ✅ Adds missing price polling service
- ✅ Realistic timeline (3 weeks)

---

**Status:** ⏸️ Waiting for approval to proceed with fixes

**First Action:** Fix database path in `scripts/db.js` - Ready to implement?
