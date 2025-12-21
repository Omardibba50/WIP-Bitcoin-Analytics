#!/usr/bin/env node
// Fill the gap between Nov 3 and current date

import dotenv from 'dotenv';
dotenv.config();

import { initDb } from './db.js';
import { insertPrice } from './pricesDb.js';

// Start from Nov 3, 2025 to now
const START_DATE = new Date('2025-11-03T03:00:00Z');
const END_DATE = new Date();

const START_MS = START_DATE.getTime();
const END_MS = END_DATE.getTime();

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
    timestamp: k[6], // closeTime
    price: parseFloat(k[4]) // close price
  }));
}

async function main() {
  initDb();
  
  console.log(`📈 Filling gap from Nov 3, 2025 to ${END_DATE.toISOString()}`);
  console.log(`  Start: ${START_DATE.toISOString()}`);
  console.log(`  End: ${END_DATE.toISOString()}\n`);
  
  let currentStart = START_MS;
  let totalInserted = 0;
  let batchNum = 0;
  
  while (currentStart < END_MS) {
    batchNum++;
    const batchEnd = Math.min(currentStart + (1000 * 60 * 60 * 1000), END_MS);
    
    try {
      const klines = await fetchBinanceKlines(currentStart, batchEnd);
      
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
      
      totalInserted += inserted;
      console.log(`  ✅ Batch ${batchNum}: ${inserted}/${klines.length} records inserted`);
      
      currentStart = batchEnd;
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (err) {
      console.error(`  ❌ Batch ${batchNum} failed:`, err.message);
      currentStart += (1000 * 60 * 60 * 1000);
    }
  }
  
  console.log(`\n✅ Complete! Inserted ${totalInserted.toLocaleString()} records`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
