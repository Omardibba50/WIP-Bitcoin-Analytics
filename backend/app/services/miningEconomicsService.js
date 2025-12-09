// Service to fetch Bitcoin mining economics data from free APIs

// Mining constants
const CURRENT_BLOCK_SUBSIDY = 3.125; // BTC per block (post-April 2024 halving)
const BLOCKS_PER_DAY = 144; // Average blocks per day (10 min per block)
const SATS_PER_BTC = 100000000;

// Cache for API responses
const cache = {
  miningStats: { data: null, timestamp: 0 },
  hashrate: { data: null, timestamp: 0 }
};

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (production optimized)

function isCacheValid(cacheEntry) {
  return cacheEntry.data && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
}

/**
 * Fetch mining economics data from multiple free APIs
 * @param {number} btcPriceUSD - Current BTC price in USD
 * @returns {Promise<Object>} Mining economics data
 */
export async function fetchMiningEconomics(btcPriceUSD) {
  // Check cache first
  if (isCacheValid(cache.miningStats)) {
    return cache.miningStats.data;
  }

  try {
    // Fetch data from multiple sources in parallel
    const [blockchainStats, mempoolData, hashrateData, difficultyData] = await Promise.allSettled([
      fetchBlockchainStats(),
      fetchMempoolMiningData(),
      fetchHashrateData(),
      fetchDifficultyData()
    ]);

    // Extract successful results
    const stats = blockchainStats.status === 'fulfilled' ? blockchainStats.value : {};
    const mempoolStats = mempoolData.status === 'fulfilled' ? mempoolData.value : {};
    const hashrate = hashrateData.status === 'fulfilled' ? hashrateData.value : null;
    const difficultyValue = difficultyData.status === 'fulfilled' ? difficultyData.value : null;

    // Calculate mining economics metrics
    const blockSubsidy = CURRENT_BLOCK_SUBSIDY;
    const blockSubsidyValue = blockSubsidy * btcPriceUSD;
    
    // Average fees per block (from blockchain.info or mempool)
    const avgFeesPerBlock = mempoolStats.avgFeesPerBlock || 
                           (stats.n_btc_mined ? (stats.n_btc_mined / BLOCKS_PER_DAY - blockSubsidy) : 0);
    
    // Calculate fees vs reward percentage
    const avgFeesVsReward = avgFeesPerBlock > 0 
      ? ((avgFeesPerBlock / blockSubsidy) * 100).toFixed(2)
      : '0.00';

    // Daily revenue per PHash/s
    // Formula: (Block Reward + Avg Fees) * Blocks per Day / Network Hashrate in PH/s
    const totalHashrate = hashrate || stats.hash_rate || 0;
    const networkHashrateEH = totalHashrate / 1000000; // Convert TH/s to EH/s
    const networkHashratePH = totalHashrate / 1000; // Convert TH/s to PH/s
    const dailyBlockReward = (blockSubsidy + avgFeesPerBlock) * BLOCKS_PER_DAY;
    const dailyPHashRevenueBTC = networkHashratePH > 0 
      ? dailyBlockReward / networkHashratePH 
      : 0;
    const dailyPHashRevenueSats = Math.round(dailyPHashRevenueBTC * SATS_PER_BTC);
    const dailyPHashRevenueUSD = dailyPHashRevenueBTC * btcPriceUSD;

    // Network difficulty - try multiple sources
    const difficulty = difficultyValue || mempoolStats.difficulty || stats.difficulty || 0;

    const result = {
      blockSubsidy: blockSubsidy,
      blockSubsidyValue: blockSubsidyValue,
      avgFeesPerBlock: avgFeesPerBlock,
      avgFeesVsReward: avgFeesVsReward,
      dailyPHashRevenueSats: dailyPHashRevenueSats,
      dailyPHashRevenueUSD: dailyPHashRevenueUSD,
      difficulty: difficulty,
      networkHashrate: totalHashrate,
      networkHashrateEH: networkHashrateEH,
      networkHashratePH: networkHashratePH,
      blocksPerDay: BLOCKS_PER_DAY,
      lastUpdated: Date.now()
    };

    // Cache the result
    cache.miningStats = { data: result, timestamp: Date.now() };

    console.log('✅ Mining economics data fetched successfully');
    return result;

  } catch (error) {
    console.error('❌ Error fetching mining economics:', error);
    
    // Return cached data if available, even if expired
    if (cache.miningStats.data) {
      console.warn('⚠️  Returning stale cached mining data');
      return cache.miningStats.data;
    }
    
    return null;
  }
}

/**
 * Fetch blockchain statistics from blockchain.info API
 * Free API, no key required
 */
async function fetchBlockchainStats() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // Try blockchain.info with redirect following
    const response = await fetch('https://blockchain.info/stats', {
      signal: controller.signal,
      redirect: 'follow'
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Blockchain.info API returned status: ${response.status}`);
    }

    const text = await response.text();
    
    // Check if response is HTML (error page) instead of JSON
    if (text.includes('<!DOCTYPE') || text.includes('<html>')) {
      throw new Error('Blockchain.info returned HTML instead of JSON');
    }

    const data = JSON.parse(text);
    console.log('✅ Blockchain.info stats fetched');
    return data;

  } catch (error) {
    console.warn('⚠️  Blockchain.info stats failed:', error.message);
    return {};
  }
}

/**
 * Fetch mining data from mempool.space API
 * Free API, no key required
 */
async function fetchMempoolMiningData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // Fetch recent blocks - the API already includes fee data in extras field
    const response = await fetch('https://mempool.space/api/v1/blocks', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Failed to fetch mempool mining data');
    }

    const blocks = await response.json();
    
    // Calculate average fees from recent blocks
    let totalFees = 0;
    let blockCount = 0;
    let totalDifficulty = 0;

    if (blocks && blocks.length > 0) {
      // Get last 10 blocks for average
      const recentBlocks = blocks.slice(0, 10);
      
      for (const block of recentBlocks) {
        // Fee data is already in the extras field - no need for additional API calls
        if (block.extras && block.extras.totalFees !== undefined) {
          totalFees += block.extras.totalFees / SATS_PER_BTC; // Convert satoshis to BTC
          blockCount++;
        }
        
        if (block.difficulty) {
          totalDifficulty += block.difficulty;
        }
      }
    }

    const avgFeesPerBlock = blockCount > 0 ? totalFees / blockCount : 0;
    const avgDifficulty = blockCount > 0 ? totalDifficulty / blockCount : 0;

    console.log(`✅ Mempool.space mining data fetched (${blockCount} blocks analyzed)`);
    console.log(`   Average fees per block: ${avgFeesPerBlock.toFixed(4)} BTC`);
    return {
      avgFeesPerBlock,
      difficulty: avgDifficulty
    };

  } catch (error) {
    console.warn('⚠️  Mempool.space mining data failed:', error.message);
    return {};
  }
}

/**
 * Fetch hashrate data from blockchain.info charts API
 * Free API, no key required
 */
async function fetchHashrateData() {
  // Check cache first
  if (isCacheValid(cache.hashrate)) {
    return cache.hashrate.data;
  }

  // Try blockchain.info first, then fallback to mempool.space
  let latestHashrate = null;
  
  // Attempt 1: blockchain.info
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('https://api.blockchain.info/charts/hash-rate?timespan=1days&format=json', {
      signal: controller.signal,
      redirect: 'follow'
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Blockchain.info API returned status: ${response.status}`);
    }

    const text = await response.text();
    
    // Check if response is HTML (error page) instead of JSON
    if (text.includes('<!DOCTYPE') || text.includes('<html>')) {
      throw new Error('Blockchain.info returned HTML instead of JSON');
    }

    const data = JSON.parse(text);
    
    // Get the latest hashrate value (in TH/s)
    latestHashrate = data.values && data.values.length > 0 
      ? data.values[data.values.length - 1].y 
      : 0;

    console.log('✅ Hashrate data fetched from blockchain.info:', latestHashrate, 'TH/s');
    
  } catch (error) {
    console.warn('⚠️  Blockchain.info hashrate failed, trying mempool.space:', error.message);
    
    // Attempt 2: mempool.space fallback
    try {
      const response = await fetch('https://mempool.space/api/v1/mining/hashrate/24h', {
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const data = await response.json();
        // mempool.space returns hashrate in EH/s, convert to TH/s
        latestHashrate = data.currentHashrate ? data.currentHashrate * 1000000 : 0;
        console.log('✅ Hashrate data fetched from mempool.space:', latestHashrate, 'TH/s');
      }
    } catch (fallbackError) {
      console.warn('⚠️  Mempool.space hashrate fallback also failed:', fallbackError.message);
    }
  }

  // Cache the result if we got data
  if (latestHashrate !== null) {
    cache.hashrate = { data: latestHashrate, timestamp: Date.now() };
  }

  // Return cached data if available, otherwise null
  if (latestHashrate === null && cache.hashrate.data) {
    return cache.hashrate.data;
  }
  
  return latestHashrate;
}

/**
 * Fetch historical hashrate data for charts
 * @param {string} timespan - Time period (e.g., '30days', '1year')
 * @returns {Promise<Array>} Array of {timestamp, hashrate} objects
 */
export async function fetchHashrateHistory(timespan = '30days') {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(
      `https://api.blockchain.info/charts/hash-rate?timespan=${timespan}&format=json&sampled=true`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Failed to fetch hashrate history');
    }

    const data = await response.json();
    
    // Transform to our format
    const history = (data.values || []).map(point => ({
      timestamp: point.x * 1000, // Convert to milliseconds
      hashrate: point.y // TH/s
    }));

    console.log('✅ Hashrate history fetched:', history.length, 'data points');
    return history;

  } catch (error) {
    console.error('❌ Error fetching hashrate history:', error);
    return [];
  }
}

/**
 * Fetch mining pool distribution from mempool.space
 * @returns {Promise<Array>} Array of mining pools with their share
 */
export async function fetchMiningPoolDistribution() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('https://mempool.space/api/v1/mining/pools/1w', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Failed to fetch mining pools');
    }

    const pools = await response.json();
    
    console.log('✅ Mining pool distribution fetched');
    return pools;

  } catch (error) {
    console.error('❌ Error fetching mining pools:', error);
    return [];
  }
}

/**
 * Fetch current difficulty from blockchain.info API
 * @returns {Promise<number>} Current network difficulty
 */
async function fetchDifficultyData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('https://blockchain.info/q/getdifficulty', {
      signal: controller.signal,
      redirect: 'follow'
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Blockchain.info API returned status: ${response.status}`);
    }

    const difficultyText = await response.text();
    
    // Check if response is HTML (error page) instead of plain text
    if (difficultyText.includes('<!DOCTYPE') || difficultyText.includes('<html>')) {
      throw new Error('Blockchain.info returned HTML instead of difficulty value');
    }
    
    const difficulty = parseFloat(difficultyText);

    console.log('✅ Difficulty data fetched:', difficulty);
    return difficulty;

  } catch (error) {
    console.warn('⚠️  Difficulty data failed:', error.message);
    return null;
  }
}
