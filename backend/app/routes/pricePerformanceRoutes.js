import express from "express";
import { fetchCachedCoinGecko } from "../utils/coingeckoCache.js";

const router = express.Router();

router.get("/performance", async (_req, res) => {
  try {
    const url =
      "https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false";

    const data = await fetchCachedCoinGecko(url);
    const market = data?.market_data;

    if (!market || !market.current_price?.usd) {
      console.warn("⚠️ Unexpected CoinGecko structure:", JSON.stringify(data).slice(0, 200));
      return res.json({
        priceUSD: 101000,
        performance: [
          { interval: "1h", changePct: 0.2, changeAbs: 200 },
          { interval: "24h", changePct: 5.2, changeAbs: 5200 },
          { interval: "7d", changePct: 11.1, changeAbs: 11100 },
          { interval: "30d", changePct: 2.3, changeAbs: 2300 },
          { interval: "ytd", changePct: 72.4, changeAbs: 72400 },
        ],
        source: "fallback",
      });
    }

    const price = market.current_price.usd;

    // Safe access helper
    const safePct = (obj) =>
      obj && typeof obj.usd === "number" ? obj.usd : 0;

    const performance = [
      { interval: "1h", changePct: safePct(market.price_change_percentage_1h_in_currency) },
      { interval: "24h", changePct: safePct(market.price_change_percentage_24h_in_currency) },
      { interval: "7d", changePct: safePct(market.price_change_percentage_7d_in_currency) },
      { interval: "30d", changePct: safePct(market.price_change_percentage_30d_in_currency) },
      { interval: "ytd", changePct: safePct(market.price_change_percentage_ytd_in_currency) },
    ].map((p) => ({
      ...p,
      changeAbs: (price * p.changePct) / 100,
    }));

    res.json({ priceUSD: price, performance, source: "live" });
  } catch (err) {
    console.error("⚠️ Error in performance route:", err.message);
    res.status(500).json({ error: "Failed to fetch performance" });
  }
});

export default router;
