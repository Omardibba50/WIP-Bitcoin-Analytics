import { getLatestBlocks, getBlockByHeight, getBlockStats, insertBlock } from '../db/blocksDb.js';
import { fetchLatestBlocks, fetchBlockByHeight } from '../services/blockchainService.js';
import { success, failure } from '../utils/responseHelpers.js';

export async function getLatest(req, res) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    
    // Try to get from database first
    let blocks = getLatestBlocks(limit);
    
    // If no data or stale data, fetch fresh
    if (!blocks || blocks.length === 0) {
      const freshBlocks = await fetchLatestBlocks(limit);
      
      // Store in database
      for (const block of freshBlocks) {
        try {
          insertBlock(
            block.height,
            block.hash,
            block.timestamp,
            block.size,
            block.txCount,
            block.miner,
            block.difficulty
          );
        } catch (err) {
          console.error('Error inserting block:', err);
        }
      }
      
      blocks = freshBlocks;
    }
    
  res.json(success(blocks));
  } catch (error) {
    console.error('Error in getLatest:', error);
  res.status(500).json(failure('Failed to fetch blocks', 500));
  }
}

export async function getByHeight(req, res) {
  try {
    const height = Number(req.params.height);
    
    let block = getBlockByHeight(height);
    
    if (!block) {
      block = await fetchBlockByHeight(height);
      if (block) {
        insertBlock(
          block.height,
          block.hash,
          block.timestamp,
          block.size,
          block.txCount,
          block.miner,
          block.difficulty
        );
      }
    }
    
    if (!block) {
      return res.status(404).json(failure('Block not found', 404));
    }
    res.json(success(block));
  } catch (error) {
    console.error('Error in getByHeight:', error);
    res.status(500).json(failure('Failed to fetch block', 500));
  }
}

export function getStats(req, res) {
  try {
    const stats = getBlockStats();
  res.json(success(stats));
  } catch (error) {
    console.error('Error in getStats:', error);
  res.status(500).json(failure('Failed to fetch stats', 500));
  }
}
