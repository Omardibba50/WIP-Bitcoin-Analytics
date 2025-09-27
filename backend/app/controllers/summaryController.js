import { getLatestPrice, getAtOrBefore } from '../db/pricesDb.js';

export function getPriceSummary(req, res) {
  try {
    const symbol = (req.query.symbol || 'BTC').toUpperCase();
    const now = Date.now();
    const latest = getLatestPrice(symbol);

    if (!latest) {
      return res.status(404).json({ error: 'No data found' });
    }

    const ts24h = now - 24 * 60 * 60 * 1000;
    const ref = getAtOrBefore(symbol, ts24h);

    const currentPrice = latest.price;
    const lastClose = ref ? ref.price : null;

    let change24hAbs = null;
    let change24hPct = null;

    if (lastClose != null && currentPrice != null) {
      change24hAbs = currentPrice - lastClose;
      change24hPct = lastClose !== 0 ? (change24hAbs / lastClose) : null;
    }

    return res.json({
      data: {
        symbol,
        currentPrice,
        ts: latest.ts,
        lastClose,
        change24hAbs,
        change24hPct
      }
    });
  } catch (err) {
    console.error('Error computing price summary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
