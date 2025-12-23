/**
 * Dashboard Controller
 * Aggregate endpoint for frontend initialization
 */

import * as priceController from './priceController.js';
import * as summaryController from './summaryController.js';
import * as blockController from './blockController.js';
import * as predictionController from './predictionController.js';
import * as modelController from './modelController.js';
import * as treasuryController from './treasuryController.js';
import * as mempoolController from './mempoolController.js';
import * as miningController from './miningController.js';
import * as metricsController from './metricsController.js';
import { getLightningStatistics } from '../services/lightningService.js';
import { getDb } from '../../db.js';

/**
 * Initialize Dashboard - Aggregate critical and secondary data
 * GET /api/dashboard/init
 */
async function initializeDashboard(req, res) {
  const startTime = Date.now();
  
  try {
    // Fetch Tier 1 (Critical) data in parallel
    const criticalPromises = [
      fetchPriceSummary(),
      fetchLatestBlock(),
      fetchAIPrediction(),
      fetchAllTimeHigh(),
    ];

    // Fetch Tier 2 (Secondary) data in parallel
    const secondaryPromises = [
      fetchPriceHistory(),
      fetchModels(),
      fetchTreasuries(),
      fetchMempoolStats(),
      fetchMiningEconomics(),
      fetchHashrateHistory(),
      fetchDifficultyHistory(),
      fetchLightningStats(),
    ];

    // Wait for all promises with graceful degradation
    const [criticalResults, secondaryResults] = await Promise.all([
      Promise.allSettled(criticalPromises),
      Promise.allSettled(secondaryPromises),
    ]);

    // Process results
    const critical = {
      priceSummary: getResult(criticalResults[0]),
      latestBlock: getResult(criticalResults[1]),
      aiPrediction: getResult(criticalResults[2]),
      allTimeHigh: getResult(criticalResults[3]),
    };

    const secondary = {
      priceHistory: getResult(secondaryResults[0]),
      models: getResult(secondaryResults[1]),
      treasuries: getResult(secondaryResults[2]),
      mempoolStats: getResult(secondaryResults[3]),
      miningEconomics: getResult(secondaryResults[4]),
      hashrateHistory: getResult(secondaryResults[5]),
      difficultyHistory: getResult(secondaryResults[6]),
      lightningStats: getResult(secondaryResults[7]),
    };

    // Collect errors for transparency
    const errorDetails = {
      critical: extractErrors(['priceSummary','latestBlock','aiPrediction','allTimeHigh'], criticalResults),
      secondary: extractErrors(['priceHistory','models','treasuries','mempoolStats','miningEconomics','hashrateHistory','difficultyHistory','lightningStats'], secondaryResults),
    };

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      data: { critical, secondary },
      errors: errorDetails,
      metadata: {
        timestamp: Date.now(),
        duration,
        version: '1.1',
      },
    });

    console.log(`[Dashboard] Initialized in ${duration}ms`);
  } catch (error) {
    console.error('[Dashboard] Initialization failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize dashboard',
      message: error.message,
    });
  }
}

/**
 * Helper function to extract result from Promise.allSettled
 */
function getResult(result) {
  if (result.status === 'fulfilled') {
    return result.value;
  }
  console.error('Data fetch failed:', result.reason);
  return null;
}

function extractErrors(keys, settledResults) {
  const map = {};
  for (let i = 0; i < keys.length; i++) {
    const r = settledResults[i];
    if (r.status === 'rejected') {
      map[keys[i]] = {
        message: r.reason?.message || 'Fetch failed',
      };
    }
  }
  return map;
}

/**
 * Fetch price summary
 */
async function fetchPriceSummary() {
  return new Promise((resolve, reject) => {
    const mockReq = { query: { symbol: 'BTC' } };
    const mockRes = {
      json: (payload) => {
        // Standardized wrapper or legacy shape
        if (payload?.success && payload.data) return resolve(payload.data);
        if (payload?.data) return resolve(payload.data);
        resolve(null);
      },
      status: () => ({
        json: (data) => reject(new Error(data.error || data.message || 'Price summary error')),
      }),
    };
    // Prefer summaryController if present; fallback to priceController
    if (summaryController.getPriceSummary) {
      summaryController.getPriceSummary(mockReq, mockRes);
    } else if (priceController.getPriceSummary) {
      priceController.getPriceSummary(mockReq, mockRes);
    } else {
      resolve(null);
    }
  });
}

/**
 * Fetch latest block
 */
async function fetchLatestBlock() {
  return new Promise((resolve, reject) => {
    const mockReq = { query: { limit: 1 } };
    const mockRes = {
      json: (payload) => {
        if (payload?.success && Array.isArray(payload.data)) return resolve(payload.data[0] || null);
        if (Array.isArray(payload?.data)) return resolve(payload.data[0] || null);
        if (Array.isArray(payload)) return resolve(payload[0] || null);
        resolve(null);
      },
      status: () => ({ json: (data) => reject(new Error(data.error || data.message || 'Latest block error')) }),
    };
    if (blockController.getLatest) {
      blockController.getLatest(mockReq, mockRes);
    } else if (blockController.getLatestBlocks) {
      blockController.getLatestBlocks(mockReq, mockRes);
    } else {
      resolve(null);
    }
  });
}

/**
 * Fetch AI prediction (with multi-horizon support)
 */
async function fetchAIPrediction() {
  return new Promise((resolve, reject) => {
    const mockReq = { query: { multi: '1' } }; // Request multi-horizon predictions
    const mockRes = {
      json: (payload) => {
        // If multi-horizon predictions are available, return them
        if (payload?.predictions) {
          return resolve(payload.predictions);
        }
        // Otherwise extract single prediction (backward compatibility)
        if (payload?.prediction) {
          return resolve(payload.prediction);
        }
        if (payload?.data?.prediction) {
          return resolve(payload.data.prediction);
        }
        resolve(null);
      },
      status: () => ({ json: (data) => reject(new Error(data.error || data.message || 'AI prediction error')) }),
    };
    
    // Use the same logic as the working AI endpoint
    getAIPredictionLatest(mockReq, mockRes);
  });
}

/**
 * Get latest AI prediction (same logic as /api/ai/predictions/latest)
 */
async function getAIPredictionLatest(req, res) {
  try {
    const multiHorizon = req.query?.multi === '1' || req.query?.multi === 'true';

    // If multi-horizon requested, generate fresh predictions
    if (multiHorizon) {
      console.log('[Dashboard] Generating multi-horizon predictions...');
      const { getAIPredictionService } = await import('../services/aiPredictionService.js');
      const service = getAIPredictionService();
      const predictions = await service.predictMultipleHorizons();
      
      return res.json({
        prediction: predictions['1h'], // Backward compatibility
        predictions: predictions,
        meta: {
          generated_at: new Date(predictions.timestamp).toISOString(),
          source: 'live',
          horizons: ['1h', '24h', '7d']
        }
      });
    }

    // Default: return latest from DB
    const db = getDb();
    
    console.log('[Dashboard] Fetching AI prediction from database...');
    
    const prediction = db.prepare(`
      SELECT * FROM predictions 
      WHERE model_id LIKE 'lstm%' 
      ORDER BY ts DESC 
      LIMIT 1
    `).get();

    console.log('[Dashboard] Found prediction:', prediction ? 'YES' : 'NO');

    if (!prediction) {
      return res.json({ prediction: null });
    }

    // Get current price for comparison
    const currentPriceRow = db.prepare(`
      SELECT price FROM prices 
      WHERE symbol = 'BTC' 
      ORDER BY ts DESC 
      LIMIT 1
    `).get();

    const currentPrice = currentPriceRow?.price || null;
    const actualChange = currentPrice ? prediction.predicted_price - currentPrice : null;
    const actualChangePercent = currentPrice ? ((actualChange / currentPrice) * 100) : null;

    const result = {
      prediction: {
        ...prediction,
        current_price: currentPrice,
        actual_change: actualChange ? Math.round(actualChange * 100) / 100 : null,
        actual_change_percent: actualChangePercent ? Math.round(actualChangePercent * 100) / 100 : null,
        predicted_at: new Date(prediction.ts).toISOString()
      }
    };

    console.log('[Dashboard] AI prediction result:', result);
    res.json(result);

  } catch (error) {
    console.error('Error fetching latest prediction:', error);
    res.status(500).json({ error: 'Failed to fetch prediction', message: error.message });
  }
}

/**
 * Fetch price history
 */
async function fetchPriceHistory() {
  return new Promise((resolve, reject) => {
    const mockReq = { query: { symbol: 'BTC', limit: 3000 } };
    const mockRes = {
      json: (payload) => {
        if (payload?.success && payload.data) return resolve(payload.data || []);
        if (payload?.data) return resolve(payload.data || []);
        resolve([]);
      },
      status: () => ({
        json: (data) => reject(new Error(data.error || data.message || 'Price history error')),
      }),
    };
    // priceController exports getHistory, not getPriceHistory
    if (priceController.getHistory) {
      priceController.getHistory(mockReq, mockRes);
    } else {
      resolve([]);
    }
  });
}

/**
 * Fetch all-time high data
 */
async function fetchAllTimeHigh() {
  return new Promise((resolve, reject) => {
    try {
      // For now, return hardcoded ATH data - in production this would come from a database or API
      const allTimeHigh = {
        price: 126160, // $126,160 ATH price
        ts: new Date('2024-10-06').getTime(), // October 6, 2024
        date: 'October 6, 2024'
      };
      resolve(allTimeHigh);
    } catch (error) {
      console.error('Error fetching all-time high:', error);
      resolve({
        price: 0,
        ts: 0,
        date: '—'
      });
    }
  });
}

/**
 * Fetch models
 */
async function fetchModels() {
  return new Promise((resolve, reject) => {
    try {
      const db = getDb();
      // Fetch distinct models from predictions table since that's where LSTM models are stored
      const models = db.prepare(`
        SELECT DISTINCT 
          model_id as id,
          model_id as name,
          'LSTM Prediction Model' as description,
          '1.0' as version,
          MAX(ts) as created_at
        FROM predictions 
        WHERE model_id LIKE 'lstm%' 
        GROUP BY model_id
        ORDER BY MAX(ts) DESC
      `).all();
      resolve(models);
    } catch (error) {
      console.error('Error fetching models:', error);
      resolve([]);
    }
  });
}

/**
 * Fetch lightning network stats
 */
async function fetchLightningStats() {
  return new Promise((resolve, reject) => {
    try {
      const lightningStats = getLightningStatistics();
      if (lightningStats) {
        resolve(lightningStats);
      } else {
        // Return empty stats if no data available
        resolve({
          capacity_satoshi: 0,
          channels: 0,
          nodes: 0,
          avg_channel_size: 0,
          network_growth: 0,
          capacity_btc: 0,
          capacity_usd: 0,
          ts: Date.now(),
          fetched_at: Date.now()
        });
      }
    } catch (error) {
      console.error('Error fetching lightning stats:', error);
      resolve({
        capacity_satoshi: 0,
        channels: 0,
        nodes: 0,
        avg_channel_size: 0,
        network_growth: 0,
        capacity_btc: 0,
        capacity_usd: 0,
        ts: Date.now(),
        fetched_at: Date.now()
      });
    }
  });
}
async function fetchTreasuries() {
  return new Promise((resolve, reject) => {
    const mockReq = {};
    const mockRes = {
      json: (payload) => {
        if (payload?.success && payload.data) return resolve(payload.data || []);
        if (payload?.data) return resolve(payload.data || []);
        resolve([]);
      },
      status: () => ({ json: (data) => reject(new Error(data.error || data.message || 'Treasuries fetch error')) }),
    };
    if (treasuryController.getAllTreasuries) {
      treasuryController.getAllTreasuries(mockReq, mockRes);
    } else {
      resolve([]);
    }
  });
}

/**
 * Fetch mempool stats
 */
async function fetchMempoolStats() {
  return new Promise((resolve, reject) => {
    const mockReq = {};
    const mockRes = {
      json: (payload) => {
        if (payload?.success && payload.data) return resolve(payload.data || {});
        if (payload?.data) return resolve(payload.data || {});
        resolve({});
      },
      status: () => ({ json: (data) => reject(new Error(data.error || data.message || 'Mempool stats error')) }),
    };
    if (mempoolController.getMempoolStats) {
      mempoolController.getMempoolStats(mockReq, mockRes);
    } else {
      resolve({});
    }
  });
}

/**
 * Fetch mining economics
 */
async function fetchMiningEconomics() {
  return new Promise((resolve, reject) => {
    const mockReq = {};
    const mockRes = {
      json: (payload) => {
        if (payload?.success && payload.data) return resolve(payload.data || {});
        if (payload?.data) return resolve(payload.data || {});
        resolve({});
      },
      status: () => ({ json: (data) => reject(new Error(data.error || data.message || 'Mining economics error')) }),
    };
    if (miningController.getMiningEconomics) {
      miningController.getMiningEconomics(mockReq, mockRes);
    } else {
      resolve({});
    }
  });
}

/**
 * Fetch hashrate history
 */
async function fetchHashrateHistory() {
  return new Promise((resolve, reject) => {
    const mockReq = { query: { limit: 100 } };
    const mockRes = {
      json: (payload) => {
        if (payload?.success && payload.data) return resolve(payload.data || []);
        if (payload?.data) return resolve(payload.data || []);
        resolve([]);
      },
      status: () => ({ json: (data) => reject(new Error(data.error || data.message || 'Hashrate history error')) }),
    };
    if (miningController.getHashrateHistory) {
      miningController.getHashrateHistory(mockReq, mockRes);
    } else {
      resolve([]);
    }
  });
}

/**
 * Fetch difficulty history
 */
async function fetchDifficultyHistory() {
  return new Promise((resolve, reject) => {
    const mockReq = { query: { limit: 100 } };
    const mockRes = {
      json: (payload) => {
        if (payload?.success && payload.data) return resolve(payload.data || []);
        if (payload?.data) return resolve(payload.data || []);
        resolve([]);
      },
      status: () => ({ json: (data) => reject(new Error(data.error || data.message || 'Difficulty history error')) }),
    };
    // Difficulty history is in metricsController
    if (metricsController.getDifficultyHistoryWithPrice) {
      metricsController.getDifficultyHistoryWithPrice(mockReq, mockRes);
    } else {
      resolve([]);
    }
  });
}

export default {
  initializeDashboard,
};
