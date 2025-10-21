// Handles price-related logic
import { getLatestPrice as fetchLatestPrice, getHistory as fetchHistory, insertPrice, getAllTimeHigh as fetchAllTimeHigh } from '../db/pricesDb.js';

export async function getLatestPrice(req, res) {
  try {
    const symbol = (req.query.symbol || 'BTC').toUpperCase();
    let data = fetchLatestPrice(symbol);
    
    // Check if data is stale (older than 5 minutes)
    const isStale = !data || (Date.now() - data.ts) > 5 * 60 * 1000;
    
    if (!data || isStale) {
      // Fetch fresh data from CoinGecko
      try {
        const id = symbol === 'BTC' ? 'bitcoin' : symbol.toLowerCase();
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd&include_24hr_change=true`;
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
      } catch (err) {
        console.error('CoinGecko fetch failed:', err);
        // If we have stale data, return it anyway
        if (data) return res.json({ data });
      }
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

export async function getAllTimeHigh(req, res) {
  try {
    const symbol = (req.query.symbol || 'BTC').toUpperCase();
    
    // Fetch real all-time high from CoinGecko
    try {
      const id = symbol === 'BTC' ? 'bitcoin' : symbol.toLowerCase();
      const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}?localization=false&tickers=false&community_data=false&developer_data=false`;
      const resp = await fetch(url);
      
      if (resp.ok) {
        const json = await resp.json();
        const athPrice = json?.market_data?.ath?.usd;
        const athDate = json?.market_data?.ath_date?.usd;
        
        if (athPrice != null) {
          const data = {
            symbol,
            price: athPrice,
            ts: athDate ? new Date(athDate).getTime() : Date.now(),
            source: 'coingecko'
          };
          return res.json({ data });
        }
      }
    } catch (err) {
      console.error('CoinGecko ATH fetch failed:', err);
    }
    
    // Fallback to local database if API fails
    const data = fetchAllTimeHigh(symbol);
    if (!data) return res.status(404).json({ error: 'No data found' });
    res.json({ data });
  } catch (err) {
    console.error('Error fetching all-time high:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
