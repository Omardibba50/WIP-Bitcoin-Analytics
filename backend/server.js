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
import predictionRoutes from "./app/routes/predictionRoutes.js";
import blockRoutes from "./app/routes/blockRoutes.js";
import treasuryRoutes from "./app/routes/treasuryRoutes.js";
import metricsRoutes from "./app/routes/metricsRoutes.js";
import lightningRoutes from "./app/routes/lightningRoutes.js";
import proxyRoutes from "./app/routes/proxyRoutes.js";

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

// Initialize Database
initDb();
createOhlcvTable();

// Initialize historical data and background services
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
      predictions: "/api/predictions",
      treasuries: "/api/treasuries",
      metrics: "/api/metrics",
      blocks: "/api/blocks",
      lightning: "/api/lightning",
    },
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true, service: "bitcoin-dashboard-backend" });
});

// Register all routes
app.use("/api/prices", priceRoutes  );
app.use("/api/CoinDeskprices", CoinDeskpricesRouter);
app.use("/api/models", modelRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/blocks", blockRoutes);
app.use("/api/treasuries", treasuryRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/lightning", lightningRoutes);
app.use("/api", proxyRoutes);

// Simple proxy endpoints to avoid frontend CORS for external data
app.get('/api/proxy/gold-xauusd', async (req, res) => {
  try {
    const resp = await fetch('https://stooq.com/q/d/l/?s=xauusd&i=d');
    if (!resp.ok) return res.status(resp.status).json({ error: 'Failed to fetch gold data' });
    const csv = await resp.text();
    // Parse CSV: date,open,high,low,close,volume
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
