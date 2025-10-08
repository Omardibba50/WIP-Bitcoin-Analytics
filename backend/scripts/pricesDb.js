// app/db/pricesDb.js
import { getDb } from './db.js';

export function getAtOrBefore(symbol, ts) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM prices
    WHERE symbol = ? AND ts <= ?
    ORDER BY ts DESC
    LIMIT 1
  `);
  return stmt.get(symbol, ts);
}

export function insertPrice(symbol, source, price, ts) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO prices (symbol, source, price, ts)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(symbol, source, price, ts);
}
