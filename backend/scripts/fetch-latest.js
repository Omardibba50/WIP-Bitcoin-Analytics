#!/usr/bin/env node
// Fetch the latest data from Dec 14 to now

import dotenv from 'dotenv';
dotenv.config();

import { initDb } from './db.js';
import { insertPrice } from './pricesDb.js';

const START_DATE = new Date('2025-12-14T20:00:00Z');
const END_DATE = new Date();

async function fetchBinanceKlines(startMs, endMs) {
  const params = new URLSearchParams({
    symbol: 'BTCUSDT',
    interval: '1h',
    startTime: String(startMs),
    endTime: String(endMs),
    limit: '1000'
  });
  const url = `https://api.binance.com/api/v3/klines?${params.toString()}`;
  
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Binance status ${resp.status}`);
  }
  
  const klines = await resp.json();
  return klines.map(k => ({
    timestamp: k[6],
    price: parseFloat(k[4])
  }));
}

async function main() {
  initDb();
  
  console.log(`📈 Fetching latest data from Dec 14 to ${END_DATE.toISOString()}`);
  
  try {
    const klines = await fetchBinanceKlines(START_DATE.getTime(), END_DATE.getTime());
    
    let inserted = 0;
    for (const kline of klines) {
      try {
        insertPrice('BTC', 'binance', kline.price, kline.timestamp);
        inserted++;
      } catch (err) {
        if (!err.message.includes('UNIQUE')) {
          console.warn(`  ⚠️  Insert failed: ${err.message}`);
        }
      }
    }
    
    console.log(`\n✅ Inserted ${inserted}/${klines.length} records`);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}

main();
