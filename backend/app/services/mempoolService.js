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
      throw new Error(`Failed to fetch mempool info: ${response.status}`);
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
      throw new Error(`Failed to fetch recommended fees: ${response.status}`);
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
    if (!response.ok) throw new Error(`Failed to fetch block height: ${response.status}`);
    
    const height = await response.text();
    const blockResponse = await fetch(`https://mempool.space/api/block/${height}`);
    
    if (!blockResponse.ok) throw new Error(`Failed to fetch block ${height}: ${blockResponse.status}`);
    return await blockResponse.json();

  } catch (error) {
    console.warn('⚠️  Failed to fetch latest block:', error.message);
    return null;
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

    let accumulatedSize = 0;
    let accumulatedFees = 0;
    let transactionCount = 0;
    let minFeeRate = 0;
    let maxFeeRate = 0;
    const avgTxSize = 250; // Average tx size in vbytes
    let predictedBlockSize = 0; // ✅ Declare here
// Old (failing):
// const url = `https://mempool.space/api/v1/fees/mempool-blocks/1`;



    try {
      const [mempoolStats, mempoolBlocks] = await Promise.all([
        fetchJSON('https://mempool.space/api/mempool'),
        fetchJSON('https://mempool.space/api/v1/fees/mempool-blocks')
      ]);
      const nextBlockPrediction = mempoolBlocks[0];

      if (nextBlockPrediction) {
        predictedBlockSize = nextBlockPrediction.medianTxWeight / 4; // from weight to vbytes
        minFeeRate = nextBlockPrediction.minFee;
        maxFeeRate = nextBlockPrediction.maxFee;
        
        const avgTxVSize = mempoolStats.vsize / mempoolStats.count || avgTxSize;
        transactionCount = Math.floor(predictedBlockSize / avgTxVSize);
        accumulatedFees = nextBlockPrediction.medianFee * predictedBlockSize;

      } else {
        // Fallback: calculate based on histogram
        const sortedHistogram = [...feeHistogram].sort((a, b) => b[0] - a[0]);
        for (const [feeRate, vsize] of sortedHistogram) {
          if (accumulatedSize + vsize <= BLOCK_SIZE_LIMIT) {
            accumulatedSize += vsize;
            accumulatedFees += (feeRate * vsize);
            transactionCount += Math.ceil(vsize / avgTxSize);
            maxFeeRate = Math.max(maxFeeRate, feeRate);
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
    } catch (error) {
      console.error('Error during next block prediction:', error);
    }

    const totalFeesBTC = (accumulatedFees || 0) / SATS_PER_BTC;
    const medianFeeRate = (accumulatedFees / (predictedBlockSize || 1)) || 1;

    return {
      transactionCount: transactionCount || 0,
      totalSize: Math.round(predictedBlockSize),
      totalFees: totalFeesBTC,
      totalFeesSats: Math.round(accumulatedFees || 0),
      medianFeeRate: Math.round(medianFeeRate * 100) / 100,
      minFeeRate: Math.max(1, minFeeRate),
      maxFeeRate: Math.max(1, maxFeeRate),
      estimatedTime: 600, // simplified
      lastUpdated: Math.floor(Date.now() / 1000)
    };

  } catch (error) {
    console.error('❌ Error predicting next block:', error);
    return {
      transactionCount: 0,
      totalSize: 0,
      totalFees: 0,
      totalFeesSats: 0,
      medianFeeRate: 1,
      minFeeRate: 1,
      maxFeeRate: 10,
      estimatedTime: 600,
      lastUpdated: Math.floor(Date.now() / 1000),
      error: error.message
    };
  }
}

/**
 * Utility to safely fetch JSON
 */
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
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
