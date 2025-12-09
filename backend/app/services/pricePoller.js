// Automatic price polling service to keep database updated
import { insertPrice } from '../db/pricesDb.js';

let pollingInterval = null;
const POLL_INTERVAL = 15 * 60 * 1000; // Poll every 15 minutes (production optimized)

export function startPricePolling() {
  if (pollingInterval) {
    console.log('⚠️  Price polling already running');
    return;
  }

  console.log('🔄 Starting automatic BTC price polling (every 15 minutes)...');
  
  // Initial fetch
  pollPrice();
  
  // Set up interval
  pollingInterval = setInterval(pollPrice, POLL_INTERVAL);
}

export function stopPricePolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('⏹️  Price polling stopped');
  }
}

async function pollPrice() {
  try {
    // Use CoinGecko API (same as existing code)
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';
    
    const headers = {};
    if (process.env.COINGECKO_API_KEY) {
      headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`CoinGecko returned status: ${response.status}`);
    }
    
    const data = await response.json();
    const price = data?.bitcoin?.usd;
    
    if (!price) {
      throw new Error('No price data from CoinGecko');
    }
    
    const now = Date.now();
    
    try {
      insertPrice('BTC', price, now, 'coingecko');
      console.log(`✅ BTC price updated: $${price.toLocaleString()}`);
    } catch (err) {
      // Skip if duplicate (UNIQUE constraint on timestamp)
      if (!err.message.includes('UNIQUE constraint')) {
        throw err;
      }
    }
    
  } catch (error) {
    console.error('❌ Error polling BTC price:', error.message);
  }
}
