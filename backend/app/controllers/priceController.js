// Handles price-related logic
import { getLatestPrice as fetchLatestPrice, getHistory as fetchHistory, insertPrice } from '../db/pricesDb.js';

export async function getLatestPrice(req, res) {
  try {
    const symbol = (req.query.symbol || 'BTC').toUpperCase();
    let data = fetchLatestPrice(symbol);
    if (!data) {
      // Fallback to CoinGecko on-demand and persist
      try {
        const id = symbol === 'BTC' ? 'bitcoin' : symbol.toLowerCase();
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd`;
        const resp = await fetch(url);
        if (resp.ok) {
          const json = await resp.json();
          const price = json?.[id]?.usd ?? null;
          if (price != null) {
            const ts = Date.now();
            try { insertPrice(symbol, 'coingecko', price, ts); } catch (_) {}
            data = { symbol, source: 'coingecko', price, ts };
          }
        }
      } catch (_) { /* ignore and fall through */ }
    }
    if (!data) return res.status(404).json({ error: 'No data found' });
    res.json({ data });
  } catch (err) {
    console.error('Error fetching latest price:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getHistory(req, res) {
  try {
    const symbol = (req.query.symbol || 'BTC').toUpperCase();
    const from = req.query.from ? Number(req.query.from) : 0;
    const to = req.query.to ? Number(req.query.to) : Date.now();
    const limit = req.query.limit ? Number(req.query.limit) : 500;
    const data = fetchHistory(symbol, from, to, limit);
    res.json({ data });
  } catch (err) {
    console.error('Error fetching price history:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
