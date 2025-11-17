// server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

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

// Background services
import { startBlockPolling } from "./app/services/blockPoller.js";
import { startTreasuryUpdater } from "./app/services/treasuryUpdater.js";
import { initializeHistoricalData } from "./app/services/priceHistoryFetcher.js";

// Candlestick backfill script
import { createOhlcvTable, updateOhlcvData } from "./scripts/backfillCoindesk.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize DB
initDb();
createOhlcvTable();

// Background processes
initializeHistoricalData();
startBlockPolling();
startTreasuryUpdater();

// Start periodic OHLCV updates (every 5 minutes)
updateOhlcvData();
setInterval(updateOhlcvData, 5 * 60 * 1000);

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

// Price Performance (fixes /api/prices/performance 404)
app.use("/api/performance", pricePerformanceRoutes);

// Models
app.use("/api/models", modelRoutes);

// Live models (fixes /api/models/live 404)
app.use("/api/models/live", modelLiveRoutes);

// Predictions
app.use("/api/predictions", predictionRoutes);

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

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
