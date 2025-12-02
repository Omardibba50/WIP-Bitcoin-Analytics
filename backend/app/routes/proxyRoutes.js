import express from 'express';

const router = express.Router();

// GET /api/proxy/gold-xauusd
// Proxies Stooq daily XAUUSD CSV and returns normalized JSON [{ timestamp, price }]
router.get('/proxy/gold-xauusd', async (req, res) => {
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

// GET /api/proxy/hashrate?timespan=60days
// Proxies Blockchain.com hash-rate chart and returns normalized JSON [{ timestamp, hashRate }]
router.get('/proxy/hashrate', async (req, res) => {
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

// GET /api/proxy/gold-live
// Returns current gold price using GoldAPI or fallback to latest from historical data
router.get('/proxy/gold-live', async (req, res) => {
  try {
    // Option 1: Try to get from metals-api.com (requires API key but has free tier)
    // For now, we'll use the most recent data from the historical endpoint
    const resp = await fetch('https://stooq.com/q/d/l/?s=xauusd&i=d');
    if (!resp.ok) {
      return res.status(resp.status).json({ error: 'Failed to fetch gold data' });
    }
    
    const csv = await resp.text();
    const lines = csv.trim().split('\n');
    
    // Get the most recent entry (skip header)
    if (lines.length < 2) {
      return res.status(404).json({ error: 'No gold data available' });
    }
    
    const latestLine = lines[1]; // Most recent is first after header
    const [date, open, high, low, close] = latestLine.split(',');
    const timestamp = new Date(date + 'T00:00:00Z').toISOString().split('T')[0];
    const price = parseFloat(close);
    
    if (!Number.isFinite(price)) {
      return res.status(500).json({ error: 'Invalid gold price data' });
    }
    
    res.json({ 
      data: [{ timestamp, price }]
    });
  } catch (e) {
    console.error('proxy gold-live error:', e);
    res.status(500).json({ error: 'Proxy error fetching live gold price' });
  }
});

export default router;
