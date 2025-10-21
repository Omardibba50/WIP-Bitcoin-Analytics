import { getDb } from '../../db.js';

export function insertBlock(height, hash, timestamp, size, txCount, miner, difficulty) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO blockchain_blocks (height, hash, timestamp, size, tx_count, miner, difficulty, fetched_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(height, hash, timestamp, size, txCount, miner, difficulty, Date.now());
}

export function getLatestBlocks(limit = 10) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM blockchain_blocks
    ORDER BY height DESC
    LIMIT ?
  `);
  return stmt.all(limit);
}

export function getBlockByHeight(height) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM blockchain_blocks WHERE height = ?');
  return stmt.get(height);
}

export function getBlockStats() {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT 
      COUNT(*) as total_blocks,
      AVG(size) as avg_size,
      AVG(tx_count) as avg_tx_count,
      MAX(height) as latest_height
    FROM blockchain_blocks
  `);
  return stmt.get();
}
