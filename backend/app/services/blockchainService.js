// Service to fetch blockchain data from public APIs

export async function fetchLatestBlocks(count = 10) {
  try {
    // Using mempool.space API (more reliable)
    const response = await fetch('https://mempool.space/api/blocks');
    if (!response.ok) throw new Error('Failed to fetch blocks');
    
    const blocks = await response.json();
    
    // Transform to our format
    return blocks.slice(0, count).map(block => ({
      height: block.height,
      hash: block.id,
      timestamp: block.timestamp * 1000, // Convert to milliseconds
      size: block.size,
      txCount: block.tx_count,
      miner: block.extras?.pool?.name || 'Unknown',
      difficulty: block.difficulty || 0
    }));
  } catch (error) {
    console.error('Error fetching blocks:', error);
    // Fallback to blockchain.info API
    try {
      const response = await fetch(`https://blockchain.info/blocks/${Date.now()}?format=json`);
      if (!response.ok) throw new Error('Blockchain.info API failed');
      
      const blocks = await response.json();
      return blocks.slice(0, count).map(block => ({
        height: block.height,
        hash: block.hash,
        timestamp: block.time * 1000,
        size: block.size,
        txCount: block.n_tx,
        miner: block.relayed_by || 'Unknown',
        difficulty: block.bits || 0
      }));
    } catch (fallbackError) {
      console.error('Fallback API also failed:', fallbackError);
      return [];
    }
  }
}

export async function fetchBlockByHeight(height) {
  try {
    const response = await fetch(`https://mempool.space/api/block-height/${height}`);
    if (!response.ok) throw new Error('Block not found');
    
    const blockHash = await response.text();
    
    // Fetch block details
    const blockResponse = await fetch(`https://mempool.space/api/block/${blockHash}`);
    if (!blockResponse.ok) throw new Error('Block details not found');
    
    const block = await blockResponse.json();
    
    return {
      height: block.height,
      hash: block.id,
      timestamp: block.timestamp * 1000,
      size: block.size,
      txCount: block.tx_count,
      miner: block.extras?.pool?.name || 'Unknown',
      difficulty: block.difficulty || 0
    };
  } catch (error) {
    console.error('Error fetching block by height:', error);
    return null;
  }
}
