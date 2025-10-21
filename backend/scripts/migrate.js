#!/usr/bin/env node
import path from "path";
import { initDb } from "../db.js";

// Define database file path
const dbPath = path.join(process.cwd(), "data", "prices.sqlite");

// Initialize DB connection
const db = initDb(dbPath);
db.pragma("foreign_keys = ON");

// ---------------------
// Create Core Tables
// ---------------------
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

  CREATE TABLE IF NOT EXISTS blockchain_blocks (
    height INTEGER PRIMARY KEY,
    hash TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    size INTEGER,
    tx_count INTEGER,
    miner TEXT,
    difficulty REAL,
    fetched_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS corporate_treasuries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL UNIQUE,
    btc_holdings REAL NOT NULL,
    usd_value REAL,
    percentage_of_supply REAL,
    country TEXT,
    last_updated INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    source TEXT NOT NULL,
    price REAL NOT NULL,
    ts INTEGER NOT NULL
  );
`);

// ---------------------
// Create Indexes
// ---------------------
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_prices_symbol_ts ON prices(symbol, ts DESC);
  CREATE INDEX IF NOT EXISTS idx_predictions_model_ts ON predictions(model_id, ts DESC);
  CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blockchain_blocks(timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_treasuries_holdings ON corporate_treasuries(btc_holdings DESC);
`);

// Done
console.log("✅ Migration complete. Database initialized at:", dbPath);
