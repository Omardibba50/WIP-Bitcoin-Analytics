#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config();

import { initDb } from './db.js';
import { insertPrice } from './pricesDb.js';

// Target: November 28, 2024 to November 28, 2025 (exactly 1 year)
const END_DATE = new Date('2025-11-28T23:59:59Z');
const START_DATE = new Date('2024-11-28T00:00:00Z');

console.log('🎯 Target date range:');
console.log('  Start:', START_DATE.toISOString());
console.log('  End:', END_DATE.toISOString());
console.log('  Days:', Math.round((END_DATE - START_DATE) / (1000 * 60 * 60 * 24)));

// Fetch from Binance in 1000-hour chunks (going backwards)
async function fetchBinanceKlines(symbol, startMs, endMs) {
  const params = new URLSearchParams({
    symbol: symbol,
    interval: '1h',
    startTime: String(startMs),
    endTime: String(endMs),
    limit: '1000'
  });
  const url = `https://api.binance.com/api/v3/klines?${params.toString()}`;
  
  console.log(`📊 Fetching ${symbol} from ${new Date(startMs).toISOString().split('T')[0]} to ${new Date(endMs).toISOString().split('T')[0]}`);
  
  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Binance status ${resp.status}: ${text}`);
  }
  
  const klines = await resp.json();
  // Binance kline format: [openTime, open, high, low, close, volume, closeTime, ...]
  return klines.map(k => ({
    timestamp: k[6], // closeTime in milliseconds
    price: parseFloat(k[4]) // close price
  }));
}

async function main() {
  initDb();
  
  const symbol = 'BTCUSDT';
  const startMs = START_DATE.getTime();
  const endMs = END_DATE.getTime();
  
  const hoursToFetch = Math.ceil((endMs - startMs) / (1000 * 60 * 60));
  console.log(`\n📈 Fetching ${hoursToFetch.toLocaleString()} hours of BTC price data...\n`);
  
  let currentStart = startMs;
  let totalInserted = 0;
  let batchNum = 0;
  
  while (currentStart < endMs) {
    batchNum++;
    const batchEnd = Math.min(currentStart + (1000 * 60 * 60 * 1000), endMs); // 1000 hours
    
    try {
      const klines = await fetchBinanceKlines(symbol, currentStart, batchEnd);
      
      let inserted = 0;
      for (const kline of klines) {
        try {
          // insertPrice(symbol, source, price, timestamp) - scripts version signature
          insertPrice('BTC', 'binance', kline.price, kline.timestamp);
          inserted++;
        } catch (err) {
          // Skip duplicates (UNIQUE constraint)
          if (!err.message.includes('UNIQUE')) {
            console.warn(`  ⚠️  Insert failed for ${new Date(kline.timestamp).toISOString()}: ${err.message}`);
          }
        }
      }
      
      totalInserted += inserted;
      console.log(`  ✅ Batch ${batchNum}: ${inserted}/${klines.length} records inserted`);
      
      currentStart = batchEnd;
      
      // Rate limit protection
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (err) {
      console.error(`  ❌ Batch ${batchNum} failed:`, err.message);
      // Continue with next batch
      currentStart += (1000 * 60 * 60 * 1000);
    }
  }
  
  console.log(`\n✅ Backfill complete!`);
  console.log(`  Total records inserted: ${totalInserted.toLocaleString()}`);
  console.log(`  Expected: ~${hoursToFetch.toLocaleString()} hours`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
