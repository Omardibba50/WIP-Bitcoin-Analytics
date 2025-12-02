// db.js
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db;

export function initDb() {
  if (!db) {
    // Use the same database as the main app
    const dbPath = path.join(__dirname, '../data/prices.sqlite');
    console.log(`📂 Using database: ${dbPath}`);
    db = new Database(dbPath);
    db.exec(`
      CREATE TABLE IF NOT EXISTS prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        source TEXT NOT NULL,
        price REAL NOT NULL,
        ts INTEGER NOT NULL,
        UNIQUE(symbol, ts)
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
