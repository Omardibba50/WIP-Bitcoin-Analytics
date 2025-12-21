#!/usr/bin/env node
// Fetch recent Bitcoin price data (last 90 days) using Binance API

import dotenv from 'dotenv';
dotenv.config();

import { initDb } from './db.js';
import { insertPrice } from './pricesDb.js';

const DAYS = 90;
const NOW = Date.now();
const START_MS = NOW - (DAYS * 24 * 60 * 60 * 1000);

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
    const text = await resp.text().catch(() => '');
    throw new Error(`Binance status ${resp.status}: ${text}`);
  }
  
  const klines = await resp.json();
  return klines.map(k => ({
    timestamp: k[6], // closeTime
    price: parseFloat(k[4]) // close price
  }));
}

async function main() {
  initDb();
  
  console.log(`📈 Fetching last ${DAYS} days of BTC hourly data from Binance...`);
  console.log(`  Start: ${new Date(START_MS).toISOString()}`);
  console.log(`  End: ${new Date(NOW).toISOString()}\n`);
  
  let currentStart = START_MS;
  let totalInserted = 0;
  let batchNum = 0;
  
  while (currentStart < NOW) {
    batchNum++;
    const batchEnd = Math.min(currentStart + (1000 * 60 * 60 * 1000), NOW); // 1000 hours
    
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
      await new Promise(resolve => setTimeout(resolve, 200)); // Rate limit
      
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
