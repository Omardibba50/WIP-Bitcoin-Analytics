import { getDb } from '../../db.js';

export function insertDifficulty(difficulty, timestamp = Date.now(), adjustmentPct = null, blockHeight = null) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO difficulty_history (difficulty, adjustment_pct, block_height, timestamp, fetched_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(difficulty, adjustmentPct, blockHeight, timestamp, Date.now());
}

export function getDifficultyHistory(from = 0, to = Date.now(), limit = 1000) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT difficulty, adjustment_pct, block_height, timestamp, fetched_at 
    FROM difficulty_history 
    WHERE timestamp BETWEEN ? AND ? 
    ORDER BY timestamp ASC 
    LIMIT ?
  `);
  return stmt.all(from, to, limit);
}

export function getLatestDifficulty() {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT difficulty, adjustment_pct, block_height, timestamp 
    FROM difficulty_history 
    ORDER BY timestamp DESC 
    LIMIT 1
  `);
  return stmt.get();
}

export function getDifficultyAdjustments(limit = 50) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT difficulty, adjustment_pct, block_height, timestamp 
    FROM difficulty_history 
    WHERE adjustment_pct IS NOT NULL 
    ORDER BY timestamp DESC 
    LIMIT ?
  `);
  return stmt.all(limit);
}

export function getDifficultyCount() {
  const db = getDb();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM difficulty_history');
  const row = stmt.get();
  return row ? row.count : 0;
}

export function deleteOldDifficultyData(olderThanTimestamp) {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM difficulty_history WHERE timestamp < ?');
  return stmt.run(olderThanTimestamp);
}
