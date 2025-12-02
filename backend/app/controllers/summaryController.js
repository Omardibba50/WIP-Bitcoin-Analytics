import { getLatestPrice, getAtOrBefore, insertPrice } from '../db/pricesDb.js';

export async function getPriceSummary(req, res) {
  try {
    const symbol = (req.query.symbol || 'BTC').toUpperCase();
    const now = Date.now();
    let latest = getLatestPrice(symbol);

    // Fetch fresh data if no data or stale (older than 2 minutes)
    const isStale = !latest || (now - latest.ts) > 2 * 60 * 1000;
    
    let volume24h = null;
    let marketCap = null;
    
    // Always fetch volume and market cap from CoinGecko (lightweight call)
    try {
      const id = symbol === 'BTC' ? 'bitcoin' : symbol.toLowerCase();
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;
      const resp = await fetch(url);
      if (resp.ok) {
        const json = await resp.json();
        const price = json?.[id]?.usd ?? null;
        volume24h = json?.[id]?.usd_24h_vol ?? null;
        marketCap = json?.[id]?.usd_market_cap ?? null;
        
        // Only update price if stale
        if (isStale && price != null) {
          try { insertPrice(symbol, price, now, 'coingecko'); } catch (_) {}
          latest = { symbol, source: 'coingecko', price, ts: now };
        }
      }
    } catch (err) {
      console.error('Failed to fetch market data:', err);
    }

    if (!latest) {
      return res.status(404).json({ error: 'No data found' });
    }

    const ts24h = now - 24 * 60 * 60 * 1000;
    let ref = getAtOrBefore(symbol, ts24h);

    // If no 24h data, try to fetch it
    if (!ref) {
      try {
        const id = symbol === 'BTC' ? 'bitcoin' : symbol.toLowerCase();
        const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=1&interval=hourly`;
        const resp = await fetch(url);
        if (resp.ok) {
          const json = await resp.json();
          if (json.prices && json.prices.length > 0) {
            // Get the oldest price (24h ago)
            const [oldTs, oldPrice] = json.prices[0];
            try { insertPrice(symbol, oldPrice, oldTs, 'coingecko'); } catch (_) {}
            ref = { symbol, source: 'coingecko', price: oldPrice, ts: oldTs };
          }
        }
      } catch (err) {
        console.error('Failed to fetch 24h price:', err);
      }
    }

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
        change24hPct,
        volume24h,
        marketCap
      }
    });
  } catch (err) {
    console.error('Error computing price summary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
