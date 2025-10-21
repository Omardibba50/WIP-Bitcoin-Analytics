import { getDb } from '../../db.js';

export function insertPrice(symbol, price, ts = Date.now(), source = 'api') {
  const d = getDb();
  const stmt = d.prepare('INSERT INTO prices(symbol, source, price, ts) VALUES (?, ?, ?, ?)');
  return stmt.run(symbol, source, price, ts);
}

export function getLatestPrice(symbol) {
  const d = getDb();
  const row = d.prepare('SELECT symbol, source, price, ts FROM prices WHERE symbol = ? ORDER BY ts DESC LIMIT 1').get(symbol);
  return row || null;
}

export function getHistory(symbol, from = 0, to = Date.now(), limit = 500) {
  const d = getDb();
  const rows = d.prepare('SELECT price, ts, source FROM prices WHERE symbol = ? AND ts BETWEEN ? AND ? ORDER BY ts ASC LIMIT ?').all(symbol, from, to, limit);
  return rows || [];
}

export function getAtOrBefore(symbol, ts) {
  const d = getDb();
  const row = d.prepare('SELECT symbol, source, price, ts FROM prices WHERE symbol = ? AND ts <= ? ORDER BY ts DESC LIMIT 1').get(symbol, ts);
  return row || null;
}

export function getPriceCount(symbol) {
  const d = getDb();
  const row = d.prepare('SELECT COUNT(*) as count FROM prices WHERE symbol = ?').get(symbol);
  return row ? row.count : 0;
}

export function getAllTimeHigh(symbol) {
  const d = getDb();
  const row = d.prepare('SELECT price, ts, source FROM prices WHERE symbol = ? ORDER BY price DESC LIMIT 1').get(symbol);
  return row || null;
}
