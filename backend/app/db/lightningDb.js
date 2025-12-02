import { getDb } from '../../db.js';

/**
 * Initialize lightning stats table
 */
export function initLightningTable() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS lightning_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      capacity_satoshi INTEGER NOT NULL,
      channels INTEGER NOT NULL,
      nodes INTEGER NOT NULL,
      avg_channel_size INTEGER NOT NULL,
      network_growth REAL NOT NULL,
      capacity_btc REAL NOT NULL,
      capacity_usd INTEGER NOT NULL,
      ts INTEGER NOT NULL,
      fetched_at INTEGER NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_lightning_ts ON lightning_stats(ts);
    CREATE INDEX IF NOT EXISTS idx_lightning_fetched_at ON lightning_stats(fetched_at);
  `);
}

/**
 * Insert lightning network statistics
 */
export function insertLightningStats(stats) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO lightning_stats (
      capacity_satoshi, channels, nodes, avg_channel_size, 
      network_growth, capacity_btc, capacity_usd, ts, fetched_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  return stmt.run(
    stats.capacity_satoshi,
    stats.channels,
    stats.nodes,
    stats.avg_channel_size,
    stats.network_growth,
    stats.capacity_btc,
    stats.capacity_usd,
    stats.ts,
    stats.fetched_at
  );
}

/**
 * Get latest lightning statistics
 */
export function getLatestLightningStats() {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM lightning_stats 
    ORDER BY ts DESC 
    LIMIT 1
  `).get();
}

/**
 * Get lightning statistics history
 */
export function getLightningStatsHistory(limit = 100) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM lightning_stats 
    ORDER BY ts DESC 
    LIMIT ?
  `).all(limit);
}

/**
 * Clean old lightning stats ( keep last 30 days)
 */
export function cleanupOldLightningStats() {
  const db = getDb();
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  const stmt = db.prepare(`
    DELETE FROM lightning_stats 
    WHERE ts < ?
  `);
  
  return stmt.run(thirtyDaysAgo);
}
