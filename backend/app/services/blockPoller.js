// Automatic block polling service to keep database updated
import { fetchLatestBlocks } from './blockchainService.js';
import { insertBlock } from '../db/blocksDb.js';

let pollingInterval = null;
const POLL_INTERVAL = 5 * 60 * 1000; // Poll every 5 minutes (blocks come ~every 10 minutes, production optimized)

export function startBlockPolling() {
  if (pollingInterval) {
    console.log('⚠️  Block polling already running');
    return;
  }

  console.log('🔄 Starting automatic block polling...');
  
  // Initial fetch
  pollBlocks();
  
  // Set up interval
  pollingInterval = setInterval(pollBlocks, POLL_INTERVAL);
}

export function stopBlockPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('⏹️  Block polling stopped');
  }
}

async function pollBlocks() {
  try {
    const blocks = await fetchLatestBlocks(10);
    
    if (!blocks || blocks.length === 0) {
      console.warn('⚠️  No blocks fetched during polling');
      return;
    }
    
    let newBlocks = 0;
    for (const block of blocks) {
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
        newBlocks++;
      } catch (err) {
        // Block already exists, skip
        if (!err.message.includes('UNIQUE constraint')) {
          console.error('Error inserting block:', err.message);
        }
      }
    }
    
    if (newBlocks > 0) {
      console.log(`✅ Updated ${newBlocks} new blocks. Latest: #${blocks[0].height}`);
    }
  } catch (error) {
    console.error('❌ Error polling blocks:', error.message);
  }
}
