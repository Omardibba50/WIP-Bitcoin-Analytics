#!/usr/bin/env node
import { initDb, getDb } from '../db.js';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'prices.sqlite');
const db = initDb(dbPath);
db.pragma('foreign_keys = ON');

// Create additional tables for predictions and models
db.exec(`
	CREATE TABLE IF NOT EXISTS models (
		id TEXT PRIMARY KEY,
		name TEXT,
		description TEXT,
		version TEXT,
		created_at INTEGER
	);

	CREATE TABLE IF NOT EXISTS predictions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		model_id TEXT,
		symbol TEXT NOT NULL,
		predicted_price REAL NOT NULL,
		confidence REAL,
		horizon TEXT,
		ts INTEGER NOT NULL,
		FOREIGN KEY(model_id) REFERENCES models(id)
	);

	CREATE TABLE IF NOT EXISTS market_snapshots (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		symbol TEXT NOT NULL,
		bid REAL,
		ask REAL,
		volume REAL,
		ts INTEGER NOT NULL
	);
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    source TEXT NOT NULL,
    price REAL NOT NULL,
    ts INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_prices_symbol_ts ON prices(symbol, ts DESC);
  CREATE INDEX IF NOT EXISTS idx_predictions_model_ts ON predictions(model_id, ts DESC);
`);

console.log('Migration complete. DB file at', dbPath);
