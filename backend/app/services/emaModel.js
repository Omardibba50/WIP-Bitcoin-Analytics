import { getHistory } from '../db/pricesDb.js';

function ema(values, period) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const alpha = 2 / (period + 1);
  let emaVal = values[0];
  for (let i = 1; i < values.length; i++) {
    emaVal = alpha * values[i] + (1 - alpha) * emaVal;
  }
  return emaVal;
}

function volatility(returns) {
  if (!Array.isArray(returns) || returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const varSum = returns.reduce((s, r) => s + (r - mean) * (r - mean), 0) / (returns.length - 1);
  return Math.sqrt(varSum);
}

export function predictEma({ symbol = 'BTC', period = 24, horizon = '1h' } = {}) {
  const now = Date.now();
  const from = now - (period + 6) * 60 * 60 * 1000; // period + buffer
  const rows = getHistory(symbol, from, now, 2000);
  if (!rows.length) return null;
  const prices = rows.map(r => r.price);
  const emaVal = ema(prices, period);

  // compute hourly returns over the last `period` samples if possible
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1];
    const cur = prices[i];
    if (prev) returns.push((cur - prev) / prev);
  }
  const vol = volatility(returns.slice(-period));
  // Heuristic confidence: 1 - (vol/5%) clamped to [0,1]
  const confidence = Math.max(0, Math.min(1, 1 - (vol / 0.05)));

  return {
    model_id: `ema_${period}h`,
    symbol,
    predicted_price: emaVal,
    confidence,
    horizon,
    ts: now
  };
}
