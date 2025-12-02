// app/routes/modelLiveRoutes.js
import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// GET /api/models/live - the base path is already /api/models/live from server.js
router.get("/", async (_req, res) => {
  // Create an AbortController to implement timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout

  try {
    const url =
      "https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false";

    // Optional: add API key headers if you have one
    const headers = {};
    if (process.env.COINGECKO_API_KEY) {
      headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
    }

    const response = await fetch(url, {
      headers,
      signal: controller.signal, //  connect timeout signal
    });

    clearTimeout(timeout); // stop timer once request finishes

    if (!response.ok) {
      throw new Error(`CoinGecko HTTP ${response.status}`);
    }

    const data = await response.json();
    const market = data?.market_data;
    if (!market?.current_price?.usd) {
      throw new Error("Missing market_data from CoinGecko");
    }

    const price = market.current_price.usd;
    const updated_at = Date.now();

    // Build your 3 live models
    const models = [
      {
        id: "ema_24h",
        name: "EMA (24h)",
        description: "Short-term trend model using 24h data.",
        accuracy: Math.abs(market.price_change_percentage_24h / 100) || 0.45,
        price,
        updated_at,
      },
      {
        id: "ema_72h",
        name: "EMA (72h)",
        description: "Medium-term trend model using 7d data.",
        accuracy: Math.abs(market.price_change_percentage_7d / 100) || 0.52,
        price,
        updated_at,
      },
      {
        id: "baseline",
        name: "Baseline (Last Price)",
        description: "Predicts price remains constant.",
        accuracy: 0.5,
        price,
        updated_at,
      },
    ];

    res.json({ data: models, source: "coingecko" });
  } catch (err) {
    clearTimeout(timeout);
    console.error("⚠️ CoinGecko fetch failed:", err.message);

    // Fallback data
    res.json({
      data: [
        {
          id: "ema_24h",
          name: "EMA (24h)",
          description: "Fallback static data.",
          accuracy: 0.45,
          price: 100000,
          updated_at: Date.now(),
        },
        {
          id: "ema_72h",
          name: "EMA (72h)",
          description: "Fallback static data.",
          accuracy: 0.52,
          price: 100000,
          updated_at: Date.now(),
        },
        {
          id: "baseline",
          name: "Baseline (Last Price)",
          description: "Fallback static data.",
          accuracy: 0.5,
          price: 100000,
          updated_at: Date.now(),
        },
      ],
      source: "fallback",
      note: "Using fallback due to timeout or API error",
    });
  }
});

export default router;
