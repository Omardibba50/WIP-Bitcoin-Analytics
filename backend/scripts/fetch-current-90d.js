#!/usr/bin/env node
// Fetch CURRENT 90 days of data using Binance API

import dotenv from 'dotenv';
dotenv.config();

import { initDb } from './db.js';
import { insertPrice } from './pricesDb.js';

async function fetchBinanceKlines(startMs, endMs) {
  const params = new URLSearchParams({
    symbol: 'BTCUSDT',
    interval: '1h',
    startTime: String(startMs),
    endTime: String(endMs),
    limit: '1000'
  });
  const url = `https://api.binance.com/api/v3/klines?${params.toString()}`;
  
  console.log(`  Fetching ${new Date(startMs).toISOString()} to ${new Date(endMs).toISOString()}`);
  
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
  
  const now = Date.now();
  const start = now - (90 * 24 * 60 * 60 * 1000); // 90 days ago
  
  console.log('📈 Fetching CURRENT 90 days of hourly BTC data');
  console.log(`  Now: ${new Date(now).toISOString()}`);
  console.log(`  Start: ${new Date(start).toISOString()}`);
  console.log('');
  
  let currentStart = start;
  let totalInserted = 0;
  let batchNum = 0;
  
  while (currentStart < now) {
    batchNum++;
    const batchEnd = Math.min(currentStart + (1000 * 60 * 60 * 1000), now);
    
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
      console.log(`  ✅ Batch ${batchNum}: ${inserted}/${klines.length} records`);
      
      currentStart = batchEnd;
      await new Promise(resolve => setTimeout(resolve, 250));
      
    } catch (err) {
      console.error(`  ❌ Batch ${batchNum} failed:`, err.message);
      currentStart += (1000 * 60 * 60 * 1000);
    }
  }
  
  console.log(`\n✅ Complete! Inserted ${totalInserted.toLocaleString()} hourly records`);
  console.log(`  Coverage: Last 90 days up to ${new Date(now).toISOString()}`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
