# 🔧 Backend API Optimization Plan - Production

## 📊 Current Situation Analysis

### Problems Identified:
1. **Background pollers are DISABLED** but need to be running efficiently
2. **On-demand API calls** on every dashboard load (11+ parallel calls)
3. **Caching exists** but intervals could be optimized
4. **External API calls** to blockchain.info, mempool.space, CoinGecko

### API Call Sources:
- ✅ **CoinGecko**: Price data (currently cached 10min)
- ✅ **Blockchain.info**: Hashrate, difficulty (currently cached 5min)
- ✅ **Mempool.space**: Block data, mempool stats (currently cached 5min)
- ✅ **Lightning Network**: Node/channel data (currently cached 5min)

---

## 🎯 Optimization Strategy

### Phase 1: Extend Cache Durations (Immediate - No Redeploy)

**Current Cache Times:**
- CoinGecko: 10 minutes
- Other services: 5 minutes

**Recommended Production Cache Times:**
```javascript
// Price data (CoinGecko)
const PRICE_CACHE_TTL = 15 * 60 * 1000; // 15 minutes (was 10)

// Mining Economics, Metrics, Mempool
const SERVICE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes (was 5)

// Hashrate & Difficulty (changes slowly)
const NETWORK_CACHE_TTL = 30 * 60 * 1000; // 30 minutes (was 5)

// Lightning Network (changes slowly)
const LIGHTNING_CACHE_TTL = 60 * 60 * 1000; // 1 hour (was 5)

// Treasury data (rarely changes)
const TREASURY_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
```

---

### Phase 2: Enable Background Pollers with Optimal Intervals

**Recommended Polling Intervals:**

| Service | Current | Recommended | Reason |
|---------|---------|-------------|--------|
| **Price Poller** | 5 min | **15 min** | Prices don't change drastically every 5 min |
| **Block Poller** | 1 min | **5 min** | Blocks come every ~10 min, 5 min is sufficient |
| **Hashrate Poller** | 1 hour | **2 hours** | Network hashrate changes gradually |
| **Difficulty Poller** | 1 hour | **2 hours** | Difficulty adjusts every 2 weeks |
| **AI Prediction** | 1 hour | **2 hours** | Don't need predictions every hour |
| **Treasury Update** | N/A | **24 hours** | Corporate holdings change rarely |
| **Lightning Stats** | N/A | **4 hours** | Network stats change gradually |

---

### Phase 3: Implement Rate Limiting (High Priority)

Add rate limiting to prevent abuse:

```javascript
// Add to server.js
import rateLimit from 'express-rate-limit';

// Global rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 min
  message: 'Too many requests, please try again later'
});

// Dashboard specific (more restrictive)
const dashboardLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 dashboard loads per 5 min
  message: 'Too many dashboard requests'
});

app.use('/api/', generalLimiter);
app.use('/api/dashboard/', dashboardLimiter);
```

---

## 📋 Implementation Steps

### Step 1: Update Cache Durations (IMMEDIATE)

**Files to Update:**
1. `app/utils/coingeckoCache.js` - Extend to 15 min
2. `app/services/miningEconomicsService.js` - Extend to 10 min
3. `app/services/bitcoinMetricsService.js` - Extend to 30 min
4. `app/services/mempoolService.js` - Extend to 10 min
5. `app/services/lightningService.js` - Extend to 1 hour

### Step 2: Update Poller Intervals (IMMEDIATE)

**Files to Update:**
1. `app/services/pricePoller.js` - Change to 15 min
2. `app/services/blockPoller.js` - Change to 5 min
3. `app/services/hashratePoller.js` - Change to 2 hours
4. `app/services/difficultyPoller.js` - Change to 2 hours
5. `app/services/aiPredictionPoller.js` - Change to 2 hours

### Step 3: Enable Background Services (IMMEDIATE)

**File:** `server.js`

Uncomment and start these services:
```javascript
// ENABLE THESE (currently commented lines 69-80)
initializeHistoricalData();        // One-time on startup
initializeHashrateHistory();        // One-time on startup
initializeDifficultyHistory();      // One-time on startup
startBlockPolling();                // Every 5 min
startHashratePolling();             // Every 2 hours
startDifficultyPolling();           // Every 2 hours
startPricePolling();                // Every 15 min
startAIPredictionPolling();         // Every 2 hours
```

### Step 4: Add Dashboard Response Caching (RECOMMENDED)

Cache the entire `/api/dashboard/init` response for 5 minutes:

```javascript
// Add to dashboardController.js
const dashboardCache = {
  data: null,
  timestamp: 0,
  TTL: 5 * 60 * 1000 // 5 minutes
};

async function initializeDashboard(req, res) {
  // Check cache first
  const now = Date.now();
  if (dashboardCache.data && (now - dashboardCache.timestamp) < dashboardCache.TTL) {
    console.log('[Dashboard] Serving cached response');
    return res.json({
      ...dashboardCache.data,
      metadata: {
        ...dashboardCache.data.metadata,
        cached: true,
        age: now - dashboardCache.timestamp
      }
    });
  }

  // ... rest of existing code ...
  
  // Cache the response before sending
  const response = {
    success: true,
    data: { critical, secondary },
    errors: errorDetails,
    metadata: {
      timestamp: Date.now(),
      duration,
      version: '1.1',
      cached: false
    }
  };
  
  dashboardCache.data = response;
  dashboardCache.timestamp = now;
  
  res.json(response);
}
```

---

## 💰 Expected Cost Savings

### Current (Without Pollers):
- Dashboard loads: ~11 API calls each
- Frontend refreshing frequently
- **Estimated**: 50-100 API calls per minute

### After Optimization:
- Background pollers: 7 pollers running at intervals
- Dashboard loads: Served from cache (5 min)
- External API calls: Heavily cached (10-60 min)
- **Estimated**: 10-20 API calls per hour

**Savings: 90-95% reduction in external API calls**

---

## 🚀 Deployment Order

### Priority 1: CRITICAL (Deploy Now)
1. ✅ Update cache durations (largest immediate impact)
2. ✅ Update poller intervals
3. ✅ Enable background pollers

### Priority 2: HIGH (Deploy Within 24h)
4. ✅ Add dashboard response caching
5. ✅ Add rate limiting

### Priority 3: MEDIUM (Optional)
6. ⚠️ Add Redis caching layer (if scaling further)
7. ⚠️ Implement CDN for static assets

---

## 📈 Monitoring Checklist

After deployment, monitor:
- [ ] Railway logs - Check poller intervals are working
- [ ] External API call frequency
- [ ] Dashboard response times
- [ ] Cache hit rates
- [ ] User experience (data freshness)

---

## ⚠️ Important Notes

1. **Data Freshness Trade-off**: Longer caching = less cost but less real-time data
2. **Bitcoin blocks**: Come every ~10 minutes, so 5-minute polling is reasonable
3. **Price volatility**: 15-minute price updates are acceptable for analytics dashboard
4. **Network stats**: Hashrate/difficulty change gradually, 2-hour intervals are fine
5. **Treasury data**: Rarely changes, 24-hour caching is more than sufficient

---

## 🔄 Rollback Plan

If issues arise:
1. Disable background pollers (comment out lines 69-80 in `server.js`)
2. Revert cache durations to original values
3. Redeploy

---

**Author**: Bitcoin Analytics Team  
**Date**: December 9, 2025  
**Status**: Ready for Implementation
