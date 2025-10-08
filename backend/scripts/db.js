// db.js
import Database from 'better-sqlite3';

let db;

export function initDb() {
  if (!db) {
    db = new Database('prices.db'); // or another path if needed
    db.exec(`
      CREATE TABLE IF NOT EXISTS prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        source TEXT NOT NULL,
        price REAL NOT NULL,
        ts INTEGER NOT NULL
      );
    `);
  }
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}
