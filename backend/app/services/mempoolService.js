// Service to fetch mempool data and predict next block
// Data source: mempool.space API

const SATS_PER_BTC = 100000000;
const BLOCK_SIZE_LIMIT = 4000000; // 4MB weight units (vbytes)

// Cache for mempool data
let mempoolCache = {
  data: null,
  timestamp: 0,
  ttl: 30000 // 30 seconds cache (mempool changes frequently)
};

function isCacheValid(cacheEntry) {
  return cacheEntry.data && (Date.now() - cacheEntry.timestamp) < cacheEntry.ttl;
}

/**
 * Fetch current mempool statistics and predict next block
 * @returns {Promise<Object>} Mempool stats and next block prediction
 */
export async function fetchMempoolStats() {
  // Check cache first
  if (isCacheValid(mempoolCache)) {
    return mempoolCache.data;
  }

  try {
    // Fetch mempool data from multiple endpoints in parallel
    const [mempoolInfo, recommendedFees] = await Promise.allSettled([
      fetchMempoolInfo(),
      fetchRecommendedFees()
    ]);

    const mempool = mempoolInfo.status === 'fulfilled' ? mempoolInfo.value : null;
    const fees = recommendedFees.status === 'fulfilled' ? recommendedFees.value : null;

    if (!mempool) {
      throw new Error('Failed to fetch mempool data');
    }

    // Calculate next block prediction
    const nextBlockPrediction = await predictNextBlock(mempool);

    const result = {
      // Current mempool stats
      transactionCount: mempool.count || 0,
      totalSize: mempool.vsize || 0,
      totalFees: mempool.total_fee ? mempool.total_fee / SATS_PER_BTC : 0,
      totalFeesSats: mempool.total_fee || 0,
      
      // Fee recommendations
      fastestFee: fees?.fastestFee || 0,
      halfHourFee: fees?.halfHourFee || 0,
      hourFee: fees?.hourFee || 0,
      economyFee: fees?.economyFee || 0,
      minimumFee: fees?.minimumFee || 0,
      
      // Next block prediction
      nextBlock: nextBlockPrediction,
      
      lastUpdated: Date.now()
    };

    // Cache the result
    mempoolCache = {
      data: result,
      timestamp: Date.now(),
      ttl: 30000
    };

    console.log('✅ Mempool stats fetched successfully');
    console.log(`   Transactions: ${result.transactionCount.toLocaleString()}`);
    console.log(`   Next block: ~${result.nextBlock.transactionCount} txs, ${result.nextBlock.totalFees.toFixed(4)} BTC fees`);
    
    return result;

  } catch (error) {
    console.error('❌ Error fetching mempool stats:', error);
    
    // Return cached data if available, even if expired
    if (mempoolCache.data) {
      console.warn('⚠️  Returning stale cached mempool data');
      return mempoolCache.data;
    }
    
    return null;
  }
}

/**
 * Fetch mempool information from mempool.space
 */
async function fetchMempoolInfo() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('https://mempool.space/api/mempool', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Failed to fetch mempool info');
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.warn('⚠️  Mempool info fetch failed:', error.message);
    throw error;
  }
}

/**
 * Fetch recommended fees from mempool.space
 */
async function fetchRecommendedFees() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('https://mempool.space/api/v1/fees/recommended', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Failed to fetch recommended fees');
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.warn('⚠️  Recommended fees fetch failed:', error.message);
    return null;
  }
}

/**
 * Fetch latest block data from mempool.space
 */
async function fetchLatestBlock() {
  try {
    const response = await fetch('https://mempool.space/api/blocks/tip/height');
    const height = await response.text();
    
    const blockResponse = await fetch(`https://mempool.space/api/block/${height}`);
    return await blockResponse.json();
  } catch (error) {
    console.warn('⚠️  Failed to fetch latest block:', error.message);
    return null;
  }
}

/**
 * Fetch block time estimates from mempool.space
 */
async function fetchMempoolBlockTimes() {
  try {
    const response = await fetch('https://mempool.space/api/v1/fees/mempool-blocks');
    return await response.json();
  } catch (error) {
    console.warn('⚠️  Failed to fetch mempool block times:', error.message);
    return [];
  }
}

/**
 * Predict next block based on mempool data
 * Uses fee histogram to estimate which transactions will be included
 */
async function predictNextBlock(mempoolData) {
  try {
    const feeHistogram = mempoolData.fee_histogram || [];
    
    if (feeHistogram.length === 0) {
      return {
        transactionCount: 0,
        totalSize: 0,
        totalFees: 0,
        totalFeesSats: 0,
        medianFeeRate: 0,
        minFeeRate: 0,
        maxFeeRate: 0,
        estimatedTime: 600 // 10 minutes default
      };
    }

    // Fee histogram is sorted by fee rate (highest first)
    // Each entry is [feeRate, vsize]
    let accumulatedSize = 0;
    let accumulatedFees = 0;
    let transactionCount = 0;
    let minFeeRate = 0;
    let maxFeeRate = 0;
    const avgTxSize = 250; // Average transaction size in vbytes

    try {
      // Fetch real-time mempool data
      const [mempoolStats, mempoolBlocks] = await Promise.all([
        fetch('https://mempool.space/api/mempool').then(res => res.json()),
        fetch('https://mempool.space/api/v1/fees/mempool-blocks/1').then(res => res.json())
      ]);

      // Get the next block predictions from mempool.space
      const nextBlockPrediction = mempoolBlocks[0];
      
      if (nextBlockPrediction) {
        // Use mempool.space's prediction for block size and fee range
        predictedBlockSize = nextBlockPrediction.medianTxWeight / 4; // Convert weight to vbytes
        minFeeRate = nextBlockPrediction.minFee;
        maxFeeRate = nextBlockPrediction.maxFee;
        
        // Calculate transaction count based on average tx size
        const avgTxVSize = mempoolStats.vsize / mempoolStats.count || 250;
        transactionCount = Math.floor(predictedBlockSize / avgTxVSize);
        
        // Calculate total fees for the predicted block
        accumulatedFees = nextBlockPrediction.medianFee * predictedBlockSize;
      } else {
        // Fallback calculation if mempool.space data is unavailable
        const sortedFeeHistogram = [...feeHistogram].sort((a, b) => b[0] - a[0]);
        const totalMempoolSize = sortedFeeHistogram.reduce((sum, [_, size]) => sum + size, 0);
        
        // Calculate dynamic block size based on recent block history
        const recentBlocks = await fetch('https://mempool.space/api/v1/blocks/24h')
          .then(res => res.json())
          .catch(() => []);
        
        // Calculate average block size from recent blocks (last 6 blocks or all from last 24h)
        const recentBlockSizes = recentBlocks
          .slice(0, 6)
          .map(block => block.size_vsize_byte || block.size);
        
        const avgRecentBlockSize = recentBlockSizes.length > 0 
          ? recentBlockSizes.reduce((a, b) => a + b, 0) / recentBlockSizes.length
          : BLOCK_SIZE_LIMIT * 0.9; // Default to 90% of max if no history
        
        // Calculate target block size (capped at 95% of max)
        predictedBlockSize = Math.min(
          Math.floor(avgRecentBlockSize * 1.1), // Allow 10% growth
          BLOCK_SIZE_LIMIT * 0.95
        );
        
        // Find the fee rate that would fill our predicted block size
        let cumulativeSize = 0;
        for (const [feeRate, vsize] of sortedFeeHistogram) {
          if (cumulativeSize >= predictedBlockSize) {
            minFeeRate = feeRate;
            break;
          }
          accumulatedSize += vsize;
          accumulatedFees += (feeRate * vsize);
          transactionCount += Math.ceil(vsize / avgTxSize);
          maxFeeRate = feeRate > maxFeeRate ? feeRate : maxFeeRate;
          minFeeRate = feeRate;
          cumulativeSize += vsize;
        }
      }
    } catch (error) {
      console.error('Error predicting next block:', error);
      // Fallback to simple calculation if API calls fail
      const sortedFeeHistogram = [...feeHistogram].sort((a, b) => b[0] - a[0]);
      for (const [feeRate, vsize] of sortedFeeHistogram) {
        if (accumulatedSize + vsize <= BLOCK_SIZE_LIMIT) {
          accumulatedSize += vsize;
          accumulatedFees += (feeRate * vsize);
          transactionCount += Math.ceil(vsize / avgTxSize);
          maxFeeRate = feeRate > maxFeeRate ? feeRate : maxFeeRate;
          minFeeRate = feeRate;
        } else {
          const remainingSize = BLOCK_SIZE_LIMIT - accumulatedSize;
          if (remainingSize > 0) {
            accumulatedSize += remainingSize;
            accumulatedFees += (feeRate * remainingSize);
            transactionCount += Math.ceil(remainingSize / avgTxSize);
            minFeeRate = feeRate;
          }
          break;
        }
      }
      predictedBlockSize = accumulatedSize;
    }
    
    // Realistic block size considerations:
    // - SegWit discount means blocks can be up to ~3.7MB in practice
    // - Miners rarely fill to absolute maximum
    // - Leave room for high-fee transactions that might come in
    const REALISTIC_BLOCK_SIZE_LIMIT = 3.7 * 1000 * 1000; // 3.7MB in vbytes
    
    // Calculate realistic block size based on recent blocks (1.0-1.6MB range)
    const AVERAGE_BLOCK_SIZE = 1.4 * 1000000; // 1.4MB in vbytes
    const MAX_BLOCK_SIZE = 1.6 * 1000000;     // 1.6MB max from recent data
    
    // If we have transactions, use them (with realistic limits)
    let finalBlockSize = Math.min(
      accumulatedSize || AVERAGE_BLOCK_SIZE,
      MAX_BLOCK_SIZE
    );
    
    // Ensure we have at least some transactions
    if (transactionCount === 0 && feeHistogram.length > 0) {
      // Estimate transaction count based on average tx size of 250vbytes
      transactionCount = Math.floor(finalBlockSize / 250);
    }
    
    const totalFeesBTC = (accumulatedFees || 0) / SATS_PER_BTC;
    const medianFeeRate = accumulatedSize > 0 ? 
      Math.max(1, Math.round(accumulatedFees / accumulatedSize)) : 5; // Default to 5 sat/vB
    
    // Get realistic fee range from mempool or use defaults
    const finalMinFeeRate = feeHistogram.length > 0 ? 
      Math.max(1, Math.round(feeHistogram[feeHistogram.length - 1][0])) : 1;
    const finalMaxFeeRate = feeHistogram.length > 0 ? 
      Math.max(10, Math.round(feeHistogram[0][0])) : 10;
    
    // Calculate estimated time based on last block
    let estimatedTime = 600; // Default 10 minutes
    try {
      const latestBlock = await fetchLatestBlock();
      if (latestBlock?.timestamp) {
        const now = Math.floor(Date.now() / 1000);
        const timeSinceLastBlock = now - latestBlock.timestamp;
        estimatedTime = Math.max(30, Math.min(1200, 600 - timeSinceLastBlock));
      }
    } catch (e) {
      console.warn('Could not get latest block time:', e);
    }
    
    // Cap transaction count at 5000 for realism
    const finalTxCount = Math.min(transactionCount, 5000);
    
    // Return the final prediction
    return {
      transactionCount: finalTxCount,
      totalSize: Math.round(finalBlockSize),
      totalFees: totalFeesBTC,
      totalFeesSats: Math.round(accumulatedFees || 0),
      medianFeeRate: Math.max(1, Math.round(medianFeeRate * 100) / 100),
      minFeeRate: Math.max(1, Math.round(finalMinFeeRate * 100) / 100 || 1),
      maxFeeRate: Math.max(1, Math.round(finalMaxFeeRate * 100) / 100 || 10),
      averageBlockSize: 1500000, // 1.5MB default
      estimatedTime: Math.max(1, Math.min(estimatedTime, 1200)),
      lastUpdated: Math.floor(Date.now() / 1000)
    };
  } catch (error) {
    console.error('❌ Error predicting next block:', error);
    
    // Return error state with default values
    return {
      transactionCount: 0,
      totalSize: 0,
      totalFees: 0,
      totalFeesSats: 0,
      medianFeeRate: 1,
      minFeeRate: 1,
      maxFeeRate: 10,
      averageBlockSize: 1000000, // 1MB default
      estimatedTime: 600, // 10 minutes default
      lastUpdated: Math.floor(Date.now() / 1000),
      error: error.message
    };
  }
}

/**
 * Clear mempool cache manually if needed
 */
export function clearMempoolCache() {
  mempoolCache = {
    data: null,
    timestamp: 0,
    ttl: 30000
  };
  console.log('✅ Mempool cache cleared');
}
