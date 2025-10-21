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

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
