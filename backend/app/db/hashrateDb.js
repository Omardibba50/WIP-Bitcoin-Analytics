import { getDb } from '../../db.js';

export function insertHashrate(hashrateThS, timestamp = Date.now()) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO hashrate_history (hashrate_ths, timestamp, fetched_at)
    VALUES (?, ?, ?)
  `);
  return stmt.run(hashrateThS, timestamp, Date.now());
}

export function getHashrateHistory(from = 0, to = Date.now(), limit = 1000) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT hashrate_ths, timestamp, fetched_at 
    FROM hashrate_history 
    WHERE timestamp BETWEEN ? AND ? 
    ORDER BY timestamp ASC 
    LIMIT ?
  `);
  return stmt.all(from, to, limit);
}

export function getLatestHashrate() {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT hashrate_ths, timestamp 
    FROM hashrate_history 
    ORDER BY timestamp DESC 
    LIMIT 1
  `);
  return stmt.get();
}

export function getHashrateCount() {
  const db = getDb();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM hashrate_history');
  const row = stmt.get();
  return row ? row.count : 0;
}

export function deleteOldHashrateData(olderThanTimestamp) {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM hashrate_history WHERE timestamp < ?');
  return stmt.run(olderThanTimestamp);
}
