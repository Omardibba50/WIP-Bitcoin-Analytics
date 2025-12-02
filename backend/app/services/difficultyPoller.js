// Service to fetch and store historical difficulty data
import { insertDifficulty, getDifficultyCount } from '../db/difficultyDb.js';

/**
 * Fetch historical difficulty data from blockchain.info
 * @param {number} days - Number of days of history to fetch
 */
export async function fetchHistoricalDifficulty(days = 30) {
  try {
    console.log(`🔄 Fetching ${days} days of historical difficulty data...`);
    
    // Blockchain.info API for difficulty (free, no API key needed)
    const url = `https://api.blockchain.info/charts/difficulty?timespan=${days}days&format=json&sampled=true&cors=true`;
    
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
    
    console.log(`   Received ${result.values.length} difficulty data points`);
    
    // Insert historical difficulty into database
    let inserted = 0;
    let skipped = 0;
    
    // Calculate adjustment percentages
    let prevDifficulty = null;
    
    for (let i = 0; i < result.values.length; i++) {
      const item = result.values[i];
      try {
        const difficulty = parseFloat(item.y);
        const timestamp = parseInt(item.x) * 1000; // Convert to milliseconds
        
        // Calculate adjustment percentage if we have previous value
        let adjustmentPct = null;
        if (prevDifficulty !== null && prevDifficulty !== 0) {
          adjustmentPct = ((difficulty - prevDifficulty) / prevDifficulty) * 100;
        }
        
        // Block height calculation (approximate based on timestamp)
        // Bitcoin started on Jan 3, 2009 00:00:00 UTC
        const genesisTimestamp = 1231006505000;
        const avgBlockTime = 10 * 60 * 1000; // 10 minutes in ms
        const blockHeight = Math.floor((timestamp - genesisTimestamp) / avgBlockTime);
        
        insertDifficulty(difficulty, timestamp, adjustmentPct, blockHeight);
        inserted++;
        prevDifficulty = difficulty;
      } catch (err) {
        // Skip duplicates
        if (err.message.includes('UNIQUE constraint')) {
          skipped++;
          prevDifficulty = parseFloat(item.y);
        } else {
          console.error(`Error inserting difficulty: ${err.message}`);
        }
      }
    }
    
    console.log(`✅ Historical difficulty fetch complete!`);
    console.log(`   Inserted: ${inserted} new data points`);
    if (skipped > 0) {
      console.log(`   Skipped: ${skipped} duplicates`);
    }
    
    return { inserted, skipped, total: result.values.length };
    
  } catch (error) {
    console.error('❌ Failed to fetch historical difficulty:', error.message);
    return null;
  }
}

/**
 * Initialize difficulty history on startup if database is empty
 */
export async function initializeDifficultyHistory() {
  try {
    const count = getDifficultyCount();
    
    if (count < 100) {
      console.log('ℹ️  Difficulty database has insufficient data, fetching historical data...');
      await fetchHistoricalDifficulty(365); // Fetch 1 year of data
    } else {
      console.log(`✅ Difficulty database has ${count} data points, skipping historical fetch`);
    }
  } catch (error) {
    console.error('Error initializing difficulty history:', error.message);
  }
}

/**
 * Poll for latest difficulty data
 */
let difficultyPollingInterval = null;
const DIFFICULTY_POLL_INTERVAL = 60 * 60 * 1000; // Poll every 1 hour

export function startDifficultyPolling() {
  if (difficultyPollingInterval) {
    console.log('⚠️  Difficulty polling already running');
    return;
  }

  console.log('🔄 Starting automatic difficulty polling...');
  
  // Initial fetch
  pollDifficulty();
  
  // Set up interval
  difficultyPollingInterval = setInterval(pollDifficulty, DIFFICULTY_POLL_INTERVAL);
}

export function stopDifficultyPolling() {
  if (difficultyPollingInterval) {
    clearInterval(difficultyPollingInterval);
    difficultyPollingInterval = null;
    console.log('⏹️  Difficulty polling stopped');
  }
}

async function pollDifficulty() {
  try {
    console.log(`\n[${new Date().toLocaleTimeString()}] Fetching latest difficulty...`);
    
    // Fetch last 2 days to ensure we get the latest
    const result = await fetchHistoricalDifficulty(2);
    
    if (result && result.inserted > 0) {
      console.log(`✅ Updated ${result.inserted} new difficulty data points`);
    }
  } catch (error) {
    console.error('❌ Error polling difficulty:', error.message);
  }
}
