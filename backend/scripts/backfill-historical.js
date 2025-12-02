#!/usr/bin/env node

/**
 * Backfills historical BTC price data using Binance API
 * Fetches data in 1000-hour batches (Binance limit) going back 730 days
 */

import dotenv from 'dotenv';
dotenv.config();

import { initDb } from './db.js';
import { insertPrice } from './pricesDb.js';

const symbol = 'BTC';
const binanceSymbol = 'BTCUSDT';
const daysToBackfill = 730; // 2 years

async function fetchBinanceBatch(startMs, endMs) {
  const params = new URLSearchParams({
    symbol: binanceSymbol,
    interval: '1h',
    startTime: String(startMs),
    endTime: String(endMs),
    limit: '1000'
  });
  const url = `https://api.binance.com/api/v3/klines?${params.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`binance status ${resp.status} ${text ? '- ' + text : ''}`);
  }
  const arr = await resp.json();
  return arr.map(k => [k[6], Number(k[4])]); // [closeTimeMs, close]
}

async function main() {
  initDb();

  const now = Date.now();
  const totalMs = daysToBackfill * 24 * 60 * 60 * 1000;
  const batchSize = 1000 * 60 * 60 * 1000; // 1000 hours in ms
  
  let currentEndMs = now;
  let currentStartMs = currentEndMs - batchSize;
  let totalInserted = 0;
  let batchNumber = 1;

  console.log(`[backfill-historical] Starting backfill for ${daysToBackfill} days`);
  console.log(`[backfill-historical] Will fetch ~${Math.ceil(totalMs / batchSize)} batches of 1000 hours each\n`);

  while (currentStartMs > (now - totalMs)) {
    try {
      console.log(`[batch ${batchNumber}] Fetching hours ${Math.round((now - currentEndMs) / (1000 * 60 * 60))} to ${Math.round((now - currentStartMs) / (1000 * 60 * 60))} hours ago...`);
      
      const klines = await fetchBinanceBatch(currentStartMs, currentEndMs);
      console.log(`[batch ${batchNumber}] Received ${klines.length} data points`);

      let inserted = 0;
      for (const [tsMs, price] of klines) {
        try {
          insertPrice(symbol, 'binance', Number(price), Number(tsMs));
          inserted++;
        } catch (err) {
          // Skip duplicates (UNIQUE constraint)
          if (!err.message.includes('UNIQUE')) {
            console.warn(`[batch ${batchNumber}] Insert failed:`, err.message);
          }
        }
      }

      console.log(`[batch ${batchNumber}] Inserted ${inserted} new rows\n`);
      totalInserted += inserted;

      // Move to next batch
      currentEndMs = currentStartMs;
      currentStartMs = currentEndMs - batchSize;
      batchNumber++;

      // Rate limit: wait 200ms between requests
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (err) {
      console.error(`[batch ${batchNumber}] Error:`, err.message);
      break;
    }
  }

  console.log(`\n[backfill-historical] Complete! Inserted ${totalInserted} total rows for ${symbol}`);
}

main().catch(err => {
  console.error('[backfill-historical] Fatal error:', err);
  process.exit(1);
});
