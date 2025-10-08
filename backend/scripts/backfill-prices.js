#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config();

import { initDb } from './db.js';
import { insertPrice, getAtOrBefore } from './pricesDb.js';

const symbol = (process.argv[2] || 'BTC').toUpperCase();
const days = Number(process.argv[3] || 30);

function toCoingeckoId(sym) {
  if (sym === 'BTC') return 'bitcoin';
  if (sym === 'ETH') return 'ethereum';
  return sym.toLowerCase();
}

function toBinanceSymbol(sym) {
  if (sym === 'BTC') return 'BTCUSDT';
  if (sym === 'ETH') return 'ETHUSDT';
  return (sym + 'USDT').toUpperCase();
}

async function fetchCgMarketChart(id, days, apiKey) {
  const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${encodeURIComponent(days)}`;
  const headers = {};
  if (apiKey) {
    headers['x-cg-demo-api-key'] = apiKey;
    headers['x-cg-pro-api-key'] = apiKey;
  }
  const resp = await fetch(url, { headers });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    const err = new Error(`coingecko status ${resp.status} ${text ? '- ' + text : ''}`);
    err.status = resp.status;
    throw err;
  }
  return resp.json();
}

async function fetchBinanceKlines(binanceSymbol, startMs, endMs) {
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
  initDb(); // ensures DB and table are ready

  const now = Date.now();
  const startMs = now - days * 24 * 60 * 60 * 1000;

  const id = toCoingeckoId(symbol);
  const apiKey = process.env.COINGECKO_API_KEY || process.env.CG_API_KEY || '';

  let pairs = [];
  let provider = '';

  try {
    console.log(`[backfill] fetching ${days}d hourly for ${symbol} via CoinGecko (${id})`);
    const data = await fetchCgMarketChart(id, days, apiKey);
    const cgPrices = Array.isArray(data.prices) ? data.prices : [];
    if (!cgPrices.length) throw new Error('coingecko returned no prices');
    pairs = cgPrices; // [tsMs, price]
    provider = 'coingecko';
  } catch (err) {
    console.warn('[backfill] CoinGecko failed, falling back to Binance:', err.message || err);
    const binanceSymbol = toBinanceSymbol(symbol);
    console.log(`[backfill] fetching ${days}d hourly for ${symbol} via Binance (${binanceSymbol})`);
    const klines = await fetchBinanceKlines(binanceSymbol, startMs, now);
    pairs = klines;
    provider = 'binance';
  }

  let inserted = 0;
  for (const [tsMs, price] of pairs) {
    try {
      const existing = await getAtOrBefore(symbol, tsMs); // ensure async/await
      if (existing && Math.abs(existing.ts - tsMs) < 60 * 60 * 1000) continue;

      insertPrice(symbol, provider, Number(price), Number(tsMs));
      inserted += 1;
    } catch (err) {
      console.warn('[backfill] insert failed at', tsMs, err.message || err);
    }
  }

  console.log(`[backfill] done using ${provider}. inserted ${inserted} rows for ${symbol}`);
}

main().catch(err => {
  console.error('[backfill] error', err);
  process.exit(1);
});
