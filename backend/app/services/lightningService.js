import { insertLightningStats, getLatestLightningStats, initLightningTable } from '../db/lightningDb.js';

/**
 * Lightning Network Service
 * Fetches real-time Lightning Network statistics from mempool.space
 */

const MEMPOOL_LIGHTNING_API = 'https://mempool.space/api/v1/lightning/statistics/latest';

/**
 * Fetch Lightning Network statistics from mempool.space
 */
export async function fetchLightningFromAPI() {
  try {
    const response = await fetch(MEMPOOL_LIGHTNING_API, {
      headers: {
        'User-Agent': 'Bitcoin-Analytics-Dashboard/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform mempool.space data to our format (data is nested under "latest")
    const latest = data.latest || {};
    
    return {
      capacity_satoshi: latest.total_capacity || 0,
      channels: latest.channel_count || 0,
      nodes: latest.node_count || 0,
      avg_channel_size: latest.avg_capacity || 0,
      network_growth: 0, // Will calculate from historical data
      capacity_btc: latest.total_capacity ? (latest.total_capacity / 100000000).toFixed(2) : 0,
      capacity_usd: 0, // Will need price data for this
      ts: Date.now(),
      fetched_at: Date.now()
    };
  } catch (error) {
    console.error('Failed to fetch Lightning Network data:', error.message);
    throw error;
  }
}

/**
 * Update Lightning Network statistics in database
 */
export async function updateLightningStats() {
  try {
    console.log('🌩️ Fetching Lightning Network statistics...');
    
    const stats = await fetchLightningFromAPI();
    
    // Calculate network growth from previous data
    const previousStats = getLatestLightningStats();
    if (previousStats && stats.capacity_satoshi > 0) {
      const growthPercent = ((stats.capacity_satoshi - previousStats.capacity_satoshi) / previousStats.capacity_satoshi) * 100;
      stats.network_growth = Math.round(growthPercent * 100) / 100; // Round to 2 decimal places
    }
    
    // Get current BTC price for USD calculation
    try {
      const priceResponse = await fetch('https://mempool.space/api/v1/price', {
        timeout: 5000
      });
      
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        if (priceData.USD) {
          stats.capacity_usd = Math.round(stats.capacity_btc * priceData.USD);
        }
      }
    } catch (priceError) {
      console.warn('Failed to fetch BTC price for USD calculation:', priceError.message);
      // Use approximate price if API fails
      stats.capacity_usd = Math.round(stats.capacity_btc * 87500);
    }
    
    // Store in database
    insertLightningStats(stats);
    
    console.log(`✅ Lightning Network updated: ${stats.capacity_btc} BTC capacity, ${stats.channels} channels, ${stats.nodes} nodes`);
    
    return stats;
  } catch (error) {
    console.error('❌ Failed to update Lightning Network statistics:', error.message);
    
    // Return last known data if available
    const lastKnown = getLatestLightningStats();
    if (lastKnown) {
      console.log('📦 Using cached Lightning Network data');
      return lastKnown;
    }
    
    throw error;
  }
}

/**
 * Get latest Lightning Network statistics
 */
export function getLightningStatistics() {
  return getLatestLightningStats();
}

/**
 * Initialize Lightning Network data fetching
 */
export function initializeLightningService() {
  // Update immediately on startup
  updateLightningStats().catch(console.error);
  
  // Update every 30 minutes
  setInterval(() => {
    updateLightningStats().catch(console.error);
  }, 30 * 60 * 1000);
  
  console.log('🌩️ Lightning Network service initialized (updates every 30 minutes)');
}

// Export the initLightningTable function for server initialization
export { initLightningTable };
