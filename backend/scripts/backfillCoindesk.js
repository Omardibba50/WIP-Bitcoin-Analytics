#!/usr/bin/env node
import dotenv from "dotenv";
dotenv.config();

import { initDb, getDb } from "../db.js";

const API_KEY = process.env.COINDESK_API_KEY;
if (!API_KEY) {
  console.error("Missing COINDESK_API_KEY in .env");
  process.exit(1);
}

// Dynamic import for fetch (ESM compatible)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function fetchCoindeskOhlcvData({
  market = "cadli",
  instrument = "BTC-USD",
  limit = 30,
  aggregate = 1,
  fill = true,
  apply_mapping = true,
  response_format = "JSON",
  groups = ["OHLC", "VOLUME"],
  to_ts = null,
} = {}) {
  const params = new URLSearchParams({
    market,
    instrument,
    limit: limit.toString(),
    aggregate: aggregate.toString(),
    fill: fill.toString(),
    apply_mapping: apply_mapping.toString(),
    response_format,
  });

  if (groups?.length) params.append("groups", groups.join(","));
  if (to_ts) params.append("to_ts", to_ts.toString());

  const url = `https://data-api.coindesk.com/index/cc/v1/historical/days?${params.toString()}`;

  const headers = {
    "x-api-key": API_KEY,
    Accept: "application/json",
  };

  const resp = await fetch(url, { headers });
  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`API error ${resp.status} - ${errText}`);
  }

  const json = await resp.json();
  const entries = json?.Data || json?.data || [];
  if (!entries.length) {
    console.warn("No OHLCV data returned");
    return [];
  }

  return entries.map((entry) => ({
    timestamp: entry.TIMESTAMP * 1000,
    open: entry.OPEN,
    high: entry.HIGH,
    low: entry.LOW,
    close: entry.CLOSE,
    volume: entry.VOLUME,
    quoteVolume: entry.QUOTE_VOLUME,
  }));
}

function createOhlcvTable() {
  const db = getDb();
  const sql = `
    CREATE TABLE IF NOT EXISTS ohlcv (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL UNIQUE,
      open REAL NOT NULL,
      high REAL NOT NULL,
      low REAL NOT NULL,
      close REAL NOT NULL,
      volume REAL NOT NULL,
      quoteVolume REAL NOT NULL
    );
  `;
  db.exec(sql);
}

function insertOhlcvData(data) {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO ohlcv
    (timestamp, open, high, low, close, volume, quoteVolume)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((rows) => {
    for (const r of rows) {
      insert.run(
        r.timestamp,
        r.open,
        r.high,
        r.low,
        r.close,
        r.volume,
        r.quoteVolume
      );
    }
  });
  insertMany(data);
}

async function updateOhlcvData() {
  try {
    console.log(`\n[${new Date().toLocaleTimeString()}] Fetching new data...`);
    const data = await fetchCoindeskOhlcvData({ limit: 30 });
    insertOhlcvData(data);
    console.log("✅ Data updated successfully.");
  } catch (err) {
    console.error("❌ Error fetching/inserting:", err.message || err);
  }
}

// Run automatically if executed directly (node backfillCoindesk.js)
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    initDb();
    createOhlcvTable();

    await updateOhlcvData();
    setInterval(updateOhlcvData, 5 * 60 * 1000);
  })();
}

// ✅ Export for use in server.js
export { createOhlcvTable, updateOhlcvData };
