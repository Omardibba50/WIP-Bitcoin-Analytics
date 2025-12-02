// Service to fetch and store historical hashrate data
import { insertHashrate, getHashrateCount } from '../db/hashrateDb.js';

/**
 * Fetch historical hashrate data from blockchain.info
 * @param {number} days - Number of days of history to fetch
 */
export async function fetchHistoricalHashrate(days = 30) {
  try {
    console.log(`🔄 Fetching ${days} days of historical hashrate data...`);
    
    // Blockchain.info API for hashrate (free, no API key needed)
    const url = `https://api.blockchain.info/charts/hash-rate?timespan=${days}days&format=json&sampled=true&cors=true`;
    
    const response = await fetch(url, {
      redirect: 'follow'
    });
    
    if (!response.ok) {
      throw new Error(`Blockchain.info API returned status: ${response.status}`);
    }
    
    const text = await response.text();
    
    // Check if response is HTML (error page) instead of JSON
    if (text.includes('<!DOCTYPE') || text.includes('<html>')) {
      throw new Error('Blockchain.info returned HTML instead of JSON');
    }
    
    const result = JSON.parse(text);
    
    if (!result.values || !Array.isArray(result.values)) {
      throw new Error('Invalid response format from blockchain.info');
    }
    
    console.log(`   Received ${result.values.length} hashrate data points`);
    
    // Insert historical hashrate into database
    let inserted = 0;
    let skipped = 0;
    
    for (const item of result.values) {
      try {
        const hashrateThS = parseFloat(item.y); // Already in TH/s
        const timestamp = parseInt(item.x) * 1000; // Convert to milliseconds
        insertHashrate(hashrateThS, timestamp);
        inserted++;
      } catch (err) {
        // Skip duplicates
        if (err.message.includes('UNIQUE constraint')) {
          skipped++;
        } else {
          console.error(`Error inserting hashrate: ${err.message}`);
        }
      }
    }
    
    console.log(`✅ Historical hashrate fetch complete!`);
    console.log(`   Inserted: ${inserted} new data points`);
    if (skipped > 0) {
      console.log(`   Skipped: ${skipped} duplicates`);
    }
    
    return { inserted, skipped, total: result.values.length };
    
  } catch (error) {
    console.error('❌ Failed to fetch historical hashrate:', error.message);
    return null;
  }
}

/**
 * Initialize hashrate history on startup if database is empty
 */
export async function initializeHashrateHistory() {
  try {
    const count = getHashrateCount();
    
    if (count < 100) {
      console.log('ℹ️  Hashrate database has insufficient data, fetching historical data...');
      await fetchHistoricalHashrate(365); // Fetch 1 year of data
    } else {
      console.log(`✅ Hashrate database has ${count} data points, skipping historical fetch`);
    }
  } catch (error) {
    console.error('Error initializing hashrate history:', error.message);
  }
}

/**
 * Poll for latest hashrate data
 */
let hashratePollingInterval = null;
const HASHRATE_POLL_INTERVAL = 60 * 60 * 1000; // Poll every 1 hour

export function startHashratePolling() {
  if (hashratePollingInterval) {
    console.log('⚠️  Hashrate polling already running');
    return;
  }

  console.log('🔄 Starting automatic hashrate polling...');
  
  // Initial fetch
  pollHashrate();
  
  // Set up interval
  hashratePollingInterval = setInterval(pollHashrate, HASHRATE_POLL_INTERVAL);
}

export function stopHashratePolling() {
  if (hashratePollingInterval) {
    clearInterval(hashratePollingInterval);
    hashratePollingInterval = null;
    console.log('⏹️  Hashrate polling stopped');
  }
}

async function pollHashrate() {
  try {
    console.log(`\n[${new Date().toLocaleTimeString()}] Fetching latest hashrate...`);
    
    // Fetch last 2 days to ensure we get the latest
    const result = await fetchHistoricalHashrate(2);
    
    if (result && result.inserted > 0) {
      console.log(`✅ Updated ${result.inserted} new hashrate data points`);
    }
  } catch (error) {
    console.error('❌ Error polling hashrate:', error.message);
  }
}
