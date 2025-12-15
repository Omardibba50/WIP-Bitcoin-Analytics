// server.js
console.log('🚀 Starting Bitcoin Dashboard Backend...');
console.log('📍 Node version:', process.version);
console.log('📍 Platform:', process.platform, process.arch);

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

console.log('✅ Core modules loaded');

import { initDb } from "./db.js";
import CoinDeskpricesRouter from "./routes/prices.js";

// Services and routes
import priceRoutes from "./app/routes/priceRoutes.js";
import modelRoutes from "./app/routes/modelRoutes.js";
import modelLiveRoutes from "./app/routes/modelLiveRoutes.js";         // ✅ now used
import predictionRoutes from "./app/routes/predictionRoutes.js";
import blockRoutes from "./app/routes/blockRoutes.js";
import treasuryRoutes from "./app/routes/treasuryRoutes.js";
import metricsRoutes from "./app/routes/metricsRoutes.js";
import lightningRoutes from "./app/routes/lightningRoutes.js";
import proxyRoutes from "./app/routes/proxyRoutes.js";                 // will now mount under /api/proxy
import miningRoutes from "./app/routes/miningRoutes.js";
import mempoolRoutes from "./app/routes/mempoolRoutes.js";
import pricePerformanceRoutes from "./app/routes/pricePerformanceRoutes.js";   // ✅ now used
import aiRoutes from "./app/routes/aiRoutes.js";                               // ✅ AI prediction routes
import dashboardRoutes from "./app/routes/dashboardRoutes.js";                 // ✅ Dashboard aggregate endpoint
import { fetchCachedCoinGecko } from "./app/utils/coingeckoCache.js";

// Background services
import { startBlockPolling } from "./app/services/blockPoller.js";
import { startTreasuryUpdater } from "./app/services/treasuryUpdater.js";
import { initializeLightningService, initLightningTable } from "./app/services/lightningService.js";
import { initializeHistoricalData } from "./app/services/priceHistoryFetcher.js";
import { initializeHashrateHistory, startHashratePolling } from "./app/services/hashratePoller.js";
import { initializeDifficultyHistory, startDifficultyPolling } from "./app/services/difficultyPoller.js";
import { startPricePolling } from "./app/services/pricePoller.js";
import { startAIPredictionPolling } from "./app/services/aiPredictionPoller.js";   // ✅ AI predictions

console.log('✅ All routes and services imported');

// Candlestick backfill script (optional - won't crash server if missing)
// import { createOhlcvTable, updateOhlcvData } from "./scripts/backfillCoindesk.js";

const app = express();
const PORT = process.env.PORT || 5000;

console.log(`🔧 Configured to run on port: ${PORT}`);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize DB with error handling
try {
  console.log('🔧 Initializing database...');
  initDb();
  console.log('✅ Database initialized successfully');
} catch (error) {
  console.error('❌ Database initialization failed:', error);
  // Don't exit, just continue - the server can still start for health checks
}
// createOhlcvTable(); // Disabled to prevent crashes

// Background processes - Production optimized intervals
console.log('🔄 Initializing background services...');

// One-time initialization (only runs if database is empty)
initializeHistoricalData();        // Fetch historical price data
initializeHashrateHistory();        // Fetch hashrate history
initializeDifficultyHistory();      // Fetch difficulty history

// Background pollers (production-optimized intervals)
startBlockPolling();                // Every 5 minutes
startHashratePolling();             // Every 2 hours
startDifficultyPolling();           // Every 2 hours  
startPricePolling();                // Every 15 minutes ✅ Optimized
startAIPredictionPolling();         // Every 2 hours ✅ Optimized

console.log('✅ All background services started');

// Start periodic OHLCV updates (every 5 minutes) - Disabled to prevent crashes
// updateOhlcvData();
// setInterval(updateOhlcvData, 5 * 60 * 1000);

// Default API info
app.get("/api", (req, res) => {
  res.json({
    message: "Welcome to the Bitcoin Data API",
    version: "1.0",
    endpoints: {
      health: "/api/health",
      prices: "/api/prices",
      models: "/api/models",
      modelsLive: "/api/models/live",
      pricePerformance: "/api/performance",
      predictions: "/api/predictions",
      ai: "/api/ai/*",
      treasuries: "/api/treasuries",
      metrics: "/api/metrics",
      blocks: "/api/blocks",
      lightning: "/api/lightning",
      mining: "/api/mining",
      mempool: "/api/mempool",
      proxy: "/api/proxy/*",
    },
  });
});

// Root route for Railway deployment health check
app.get("/", (req, res) => {
  res.status(200).json({ 
    ok: true, 
    service: "bitcoin-dashboard-backend",
    message: "Backend is running",
    health: "/api/health"
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true, service: "bitcoin-dashboard-backend" });
});

/* ----------------------------
   ✅ FIXED AND CONSOLIDATED ROUTES
   ---------------------------- */

// Prices
app.use("/api/prices", priceRoutes);
app.use("/api/CoinDeskprices", CoinDeskpricesRouter);

// Price Performance routes (mount at both /api/performance and /api/price-performance)
app.use("/api/performance", pricePerformanceRoutes);
app.use("/api/price-performance", pricePerformanceRoutes);

// Models
app.use("/api/models", modelRoutes);

// Live models (fixes /api/models/live 404)
app.use("/api/models/live", modelLiveRoutes);

// Predictions
app.use("/api/predictions", predictionRoutes);

// AI Predictions (LSTM model)
app.use("/api/ai/predictions", aiRoutes);
app.use("/api/ai/model", aiRoutes);
app.use("/api/ai", aiRoutes);

// Blocks
app.use("/api/blocks", blockRoutes);

// Treasuries
app.use("/api/treasuries", treasuryRoutes);

// Metrics  (fixes /api/metrics/hashrate 404 once defined in metricsRoutes.js)
app.use("/api/metrics", metricsRoutes);

// Lightning
app.use("/api/lightning", lightningRoutes);

// Mining
app.use("/api/mining", miningRoutes);

// Mempool
app.use("/api/mempool", mempoolRoutes);

// Dashboard aggregate endpoint (high performance, single request)
app.use("/api/dashboard", dashboardRoutes);

// Proxy API routes (now correctly mounted as /api/proxy/...)
app.use("/api/proxy", proxyRoutes);

/* ----------------------------------------
   Built-in Proxy Endpoints for Gold + Hashrate
   ---------------------------------------- */

// Gold (historical)
app.get('/api/proxy/gold-xauusd', async (req, res) => {
  try {
    const resp = await fetch('https://stooq.com/q/d/l/?s=xauusd&i=d');
    if (!resp.ok) return res.status(resp.status).json({ error: 'Failed to fetch gold data' });
    const csv = await resp.text();
    const lines = csv.trim().split('\n');

    const data = lines.slice(1).map(line => {
      const [date, open, high, low, close] = line.split(',');
      const ts = new Date(date + 'T00:00:00Z').getTime();
      const price = parseFloat(close);
      return { timestamp: ts, price };
    }).filter(r => Number.isFinite(r.timestamp) && Number.isFinite(r.price));

    res.json({ data });
  } catch (e) {
    console.error('proxy gold-xauusd error:', e);
    res.status(500).json({ error: 'Proxy error fetching gold data' });
  }
});

// In-memory cache for CoinGecko data
const coinGeckoCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Track in-flight requests to prevent duplicates
const pendingRequests = new Map();

// CoinGecko proxy endpoints for new investment analytics
app.get('/api/proxy/coingecko/market-chart', async (req, res) => {
  try {
    const { id = 'bitcoin', vs_currency = 'usd', days = '30', interval = 'daily' } = req.query;
    const cacheKey = `market-chart-${id}-${vs_currency}-${interval}`;
    
    // Check cache first
    const cached = coinGeckoCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Returning cached data for ${cacheKey}`);
      
      // Slice the cached data to match requested days
      if (cached.data.prices && cached.data.prices.length > 0) {
        const daysNum = parseInt(days);
        const pointsPerDay = 1; // Daily interval
        const totalPoints = daysNum * pointsPerDay;
        const slicedData = {
          ...cached.data,
          prices: cached.data.prices.slice(-totalPoints),
          market_caps: cached.data.market_caps?.slice(-totalPoints) || [],
          total_volumes: cached.data.total_volumes?.slice(-totalPoints) || []
        };
        return res.json(slicedData);
      }
      return res.json(cached.data);
    }
    
    // Check if request is already in flight
    if (pendingRequests.has(cacheKey)) {
      console.log(`Request for ${cacheKey} already in flight, waiting...`);
      try {
        const data = await pendingRequests.get(cacheKey);
        
        // Slice the data to match requested days
        if (data.prices && data.prices.length > 0) {
          const daysNum = parseInt(days);
          const pointsPerDay = 1;
          const totalPoints = daysNum * pointsPerDay;
          const slicedData = {
            ...data,
            prices: data.prices.slice(-totalPoints),
            market_caps: data.market_caps?.slice(-totalPoints) || [],
            total_volumes: data.total_volumes?.slice(-totalPoints) || []
          };
          return res.json(slicedData);
        }
        return res.json(data);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch from pending request' });
      }
    }
    
    // Create the fetch promise and store it
    const fetchPromise = (async () => {
      // CoinGecko free API limits to 365 days max
      const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=${vs_currency}&days=365&interval=${interval}`;
      
      console.log(`Fetching CoinGecko market chart: ${url}`);
      const resp = await fetch(url);
      console.log(`CoinGecko market chart response status: ${resp.status}`);
      
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error(`CoinGecko market chart error response: ${errorText}`);
        pendingRequests.delete(cacheKey);
        throw new Error(`Failed to fetch market chart: ${resp.status}`);
      }
      
      const data = await resp.json();
      
      // Cache the full 730 days data
      coinGeckoCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      console.log(`Cached ${cacheKey} for 5 minutes`);
      
      // Remove from pending requests
      pendingRequests.delete(cacheKey);
      
      return data;
    })();
    
    // Store the promise
    pendingRequests.set(cacheKey, fetchPromise);
    
    // Wait for the fetch to complete
    const data = await fetchPromise;
    
    // Return only requested days
    const daysNum = parseInt(days);
    const pointsPerDay = 1;
    const totalPoints = daysNum * pointsPerDay;
    const slicedData = {
      ...data,
      prices: data.prices.slice(-totalPoints),
      market_caps: data.market_caps?.slice(-totalPoints) || [],
      total_volumes: data.total_volumes?.slice(-totalPoints) || []
    };
    
    res.json(slicedData);
  } catch (e) {
    console.error('proxy coingecko market-chart error:', e);
    res.status(500).json({ error: 'Proxy error fetching market chart' });
  }
});

app.get('/api/proxy/coingecko/global', async (req, res) => {
  try {
    const cacheKey = 'global-data';
    
    // Check cache first
    const cached = coinGeckoCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Returning cached data for ${cacheKey}`);
      return res.json(cached.data);
    }
    
    // Check if request is already in flight
    if (pendingRequests.has(cacheKey)) {
      console.log(`Request for ${cacheKey} already in flight, waiting...`);
      try {
        const data = await pendingRequests.get(cacheKey);
        return res.json(data);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch from pending request' });
      }
    }
    
    // Create the fetch promise and store it
    const fetchPromise = (async () => {
      const url = 'https://api.coingecko.com/api/v3/global';
      
      console.log(`Fetching CoinGecko global: ${url}`);
      const resp = await fetch(url);
      console.log(`CoinGecko global response status: ${resp.status}`);
      
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error(`CoinGecko global error response: ${errorText}`);
        pendingRequests.delete(cacheKey);
        throw new Error(`Failed to fetch global data: ${resp.status}`);
      }
      
      const data = await resp.json();
      
      // Cache the data
      coinGeckoCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      console.log(`Cached ${cacheKey} for 5 minutes`);
      
      // Remove from pending requests
      pendingRequests.delete(cacheKey);
      
      return data;
    })();
    
    // Store the promise
    pendingRequests.set(cacheKey, fetchPromise);
    
    // Wait for the fetch to complete
    const data = await fetchPromise;
    
    res.json(data);
  } catch (e) {
    console.error('proxy coingecko global error:', e);
    res.status(500).json({ error: 'Proxy error fetching global data' });
  }
});

app.get('/api/proxy/blockchain/total-bitcoins', async (req, res) => {
  try {
    const { timespan = '365days', format = 'json' } = req.query;
    const url = `https://api.blockchain.info/charts/total-bitcoins?timespan=${encodeURIComponent(timespan)}&format=${format}&cors=true`;
    
    const resp = await fetch(url);
    if (!resp.ok) return res.status(resp.status).json({ error: 'Failed to fetch total bitcoins' });
    
    const text = await resp.text();
    
    // Check if we got HTML instead of JSON
    if (text.includes('<!DOCTYPE') || text.includes('<html>')) {
      throw new Error('API returned HTML instead of JSON');
    }
    
    const data = JSON.parse(text);
    res.json(data);
  } catch (e) {
    console.error('proxy blockchain total-bitcoins error:', e);
    res.status(500).json({ error: 'Proxy error fetching total bitcoins' });
  }
});

// Real-time hashrate
app.get('/api/proxy/hashrate', async (req, res) => {
  try {
    const timespan = req.query.timespan || '60days';
    const url = `https://api.blockchain.info/charts/hash-rate?timespan=${encodeURIComponent(timespan)}&format=json&sampled=true`;

    const resp = await fetch(url);
    if (!resp.ok) return res.status(resp.status).json({ error: 'Failed to fetch hash rate' });

    const json = await resp.json();
    const data = (json.values || []).map(p => ({ timestamp: p.x * 1000, hashRate: p.y }));

    res.json({ data });
  } catch (e) {
    console.error('proxy hashrate error:', e);
    res.status(500).json({ error: 'Proxy error fetching hash rate' });
  }
});

// Start server with error handling
console.log(`🔧 Attempting to start server on 0.0.0.0:${PORT}...`);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend running on http://0.0.0.0:${PORT}`);
  console.log('✅ Health check available at: http://0.0.0.0:' + PORT + '/');
  console.log('✅ API available at: http://0.0.0.0:' + PORT + '/api');
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
