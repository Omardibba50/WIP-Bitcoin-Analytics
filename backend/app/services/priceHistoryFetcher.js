// Service to fetch historical Bitcoin price data
import { insertPrice } from '../db/pricesDb.js';

export async function fetchHistoricalPrices(days = 30) {
  try {
    console.log(`🔄 Fetching ${days} days of historical BTC price data...`);
    
    // Use blockchain.info API for historical data (free, no API key needed)
    // Format: https://api.blockchain.info/charts/market-price?timespan=30days&format=json
    const url = `https://api.blockchain.info/charts/market-price?timespan=${days}days&format=json&cors=true`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Blockchain.info API returned status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.values || !Array.isArray(result.values)) {
      throw new Error('Invalid response format from blockchain.info');
    }
    
    console.log(`   Received ${result.values.length} price data points`);
    
    // Insert historical prices into database
    let inserted = 0;
    let skipped = 0;
    
    for (const item of result.values) {
      try {
        const price = parseFloat(item.y);
        const timestamp = parseInt(item.x) * 1000; // Convert to milliseconds
        insertPrice('BTC', price, timestamp);
        inserted++;
      } catch (err) {
        // Skip duplicates
        if (err.message.includes('UNIQUE constraint')) {
          skipped++;
        } else {
          console.error(`Error inserting price: ${err.message}`);
        }
      }
    }
    
    console.log(`✅ Historical price fetch complete!`);
    console.log(`   Inserted: ${inserted} new prices`);
    if (skipped > 0) {
      console.log(`   Skipped: ${skipped} duplicates`);
    }
    
    return { inserted, skipped, total: result.values.length };
    
  } catch (error) {
    console.error('❌ Failed to fetch historical prices:', error.message);
    return null;
  }
}

// Fetch on startup if database is empty
export async function initializeHistoricalData() {
  try {
    const { getPriceCount } = await import('../db/pricesDb.js');
    const count = getPriceCount('BTC');
    
    if (count < 100) {
      console.log('ℹ️  Price database has insufficient data, fetching historical prices...');
      await fetchHistoricalPrices(30);
    } else {
      console.log(`✅ Price database has ${count} data points, skipping historical fetch`);
    }
  } catch (error) {
    console.error('Error initializing historical data:', error.message);
  }
}
