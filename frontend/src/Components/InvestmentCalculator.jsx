import React, { useMemo, useRef, useState } from 'react';
import api from '../services/api';
import './InvestmentCalculator.css';

const InvestmentCalculator = () => {
  const [investmentEntries, setInvestmentEntries] = useState([
    { year: '', amount: '' },
  ]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef({}); // { [year]: averagePrice }

  const toUsd = useMemo(() =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }),
  []);

  async function fetchYearlyAverageFromCoinGecko(year) {
    const fromSec = Math.floor(new Date(`${year}-01-01T00:00:00Z`).getTime() / 1000);
    const toSec = Math.floor(new Date(`${year}-12-31T23:59:59Z`).getTime() / 1000);
    const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${fromSec}&to=${toSec}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const err = new Error(`CoinGecko range error: ${resp.status}`);
      err.status = resp.status;
      throw err;
    }
    const json = await resp.json();
    const prices = Array.isArray(json?.prices) ? json.prices : [];
    const values = prices.map(p => Number(p[1])).filter(Number.isFinite);
    if (!values.length) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  async function fetchYearlyAverageFromCryptoCompare(year) {
    const start = Math.floor(new Date(`${year}-01-01T00:00:00Z`).getTime() / 1000);
    const end = Math.floor(new Date(`${year}-12-31T23:59:59Z`).getTime() / 1000);
    // Ask for daily candles up to end of year; limit big enough to cover the whole year
    const limit = 400; // > 365
    const url = `https://min-api.cryptocompare.com/data/v2/histoday?fsym=BTC&tsym=USD&toTs=${end}&limit=${limit}&aggregate=1`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`CryptoCompare error: ${resp.status}`);
    const json = await resp.json();
    const arr = json?.Data?.Data || [];
    const withinYear = arr.filter(d => Number.isFinite(d?.time) && d.time >= start && d.time <= end);
    const closes = withinYear.map(d => Number(d.close)).filter(Number.isFinite);
    if (!closes.length) return null;
    return closes.reduce((a, b) => a + b, 0) / closes.length;
  }

  async function fetchCurrentPrice() {
    // 1) Try CoinGecko
    try {
      const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';
      const resp = await fetch(url);
      if (resp.ok) {
        const json = await resp.json();
        const val = Number(json?.bitcoin?.usd);
        if (Number.isFinite(val)) return val;
      }
    } catch (_) {}
    // 2) Try CoinDesk
    try {
      const resp = await fetch('https://api.coindesk.com/v1/bpi/currentprice/USD.json');
      if (resp.ok) {
        const json = await resp.json();
        const val = Number(json?.bpi?.USD?.rate_float);
        if (Number.isFinite(val)) return val;
      }
    } catch (_) {}
    // 3) Try Blockchain.info
    try {
      const resp = await fetch('https://blockchain.info/ticker');
      if (resp.ok) {
        const json = await resp.json();
        const val = Number(json?.USD?.last);
        if (Number.isFinite(val)) return val;
      }
    } catch (_) {}
    throw new Error('Failed to fetch current price from all sources');
  }

  const calculateReturn = async () => {
    // Validate rows
    const cleaned = investmentEntries
      .map(r => ({ year: String(r.year).trim(), amount: Number(r.amount) }))
      .filter(r => r.year && Number.isFinite(r.amount) && r.amount > 0);

    if (!cleaned.length) {
      setError('Please add at least one valid row (year and positive amount).');
      return;
    }
    const invalid = cleaned.find(r => !/^\d{4}$/.test(r.year));
    if (invalid) {
      setError(`Invalid year: ${invalid.year}. Use YYYY format (e.g., 2017).`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);
      // Fetch current price once
      const currentPrice = await fetchCurrentPrice();

      // Resolve per-year averages (with cache and fallbacks)
      const perYear = {};
      for (const { year } of cleaned) {
        if (perYear[year]) continue;
        let yearlyAverage = cacheRef.current[year];
        if (yearlyAverage == null) {
          try {
            const resp = await api.get(`/api/prices/year-avg/${year}`);
            yearlyAverage = Number(resp?.data?.averagePrice ?? resp?.averagePrice);
          } catch (_) {}
          if (yearlyAverage == null || !Number.isFinite(yearlyAverage)) {
            try {
              yearlyAverage = await fetchYearlyAverageFromCoinGecko(year);
            } catch (err) {
              if (err?.status === 429) {
                yearlyAverage = await fetchYearlyAverageFromCryptoCompare(year);
              } else {
                try {
                  yearlyAverage = await fetchYearlyAverageFromCryptoCompare(year);
                } catch (_) {
                  throw err;
                }
              }
            }
          }
          if (yearlyAverage != null) cacheRef.current[year] = yearlyAverage;
        }
        perYear[year] = yearlyAverage;
      }

      // Validate availability
      const missing = Object.entries(perYear).find(([, avg]) => avg == null);
      if (missing) {
        setError(`No price data available for the year ${missing[0]}.`);
        return;
      }

      // Compute row-wise and totals
      const rows = cleaned.map(({ year, amount }) => {
        const avg = perYear[year];
        const btc = amount / avg;
        const nowVal = btc * currentPrice;
        return {
          year,
          amount,
          yearlyAverage: avg,
          btcBought: btc,
          currentValue: nowVal,
        };
      });

      const totalInvested = rows.reduce((s, r) => s + r.amount, 0);
      const totalBTC = rows.reduce((s, r) => s + r.btcBought, 0);
      const totalCurrentValue = totalBTC * currentPrice;
      const returnOnInvestment = totalCurrentValue - totalInvested;
      const returnPercentage = (returnOnInvestment / totalInvested) * 100;
      const avgCostBasis = totalBTC > 0 ? totalInvested / totalBTC : 0;

      setResult({
        rows,
        totals: {
          totalInvested,
          totalBTC,
          totalCurrentValue,
          returnOnInvestment,
          returnPercentage,
          avgCostBasis,
        },
        meta: {
          currentPrice,
        },
      });
    } catch (err) {
      const msg = err?.status === 429
        ? 'Rate limited by data provider. Please wait a minute and try again.'
        : (err?.message ? `Failed to calculate: ${err.message}` : 'Failed to calculate investment return. Please try again later.');
      setError(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="investment-calculator">
      <h2>BTC Investment Calculator</h2>

      {/* Dynamic rows for multiple years */}
      {investmentEntries.map((row, idx) => (
        <div className="input-group" key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
          <div>
            <label>Investment Year</label>
            <input
              type="number"
              value={row.year}
              onChange={(e) => {
                const v = e.target.value;
                setInvestmentEntries(prev => prev.map((r, i) => i === idx ? { ...r, year: v } : r));
              }}
              placeholder="e.g., 2017"
            />
          </div>
          <div>
            <label>Amount (USD)</label>
            <input
              type="number"
              value={row.amount}
              onChange={(e) => {
                const v = e.target.value;
                setInvestmentEntries(prev => prev.map((r, i) => i === idx ? { ...r, amount: v } : r));
              }}
              placeholder="e.g., 1000"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={() => setInvestmentEntries(prev => prev.filter((_, i) => i !== idx))}
              disabled={investmentEntries.length === 1}
              style={{ width: '100%' }}
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="button" onClick={() => setInvestmentEntries(prev => [...prev, { year: '', amount: '' }])}>
          + Add Year
        </button>
        <button onClick={calculateReturn} disabled={loading}>
          {loading ? 'Calculating…' : 'Calculate'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {result && (
        <div className="result">
          <h3>Calculation Result</h3>

          {/* Breakdown */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px' }}>Year</th>
                  <th style={{ textAlign: 'right', padding: '6px' }}>Amount (USD)</th>
                  <th style={{ textAlign: 'right', padding: '6px' }}>Avg Price</th>
                  <th style={{ textAlign: 'right', padding: '6px' }}>BTC Bought</th>
                  <th style={{ textAlign: 'right', padding: '6px' }}>Value Now</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ padding: '6px' }}>{r.year}</td>
                    <td style={{ padding: '6px', textAlign: 'right' }}>{toUsd.format(r.amount)}</td>
                    <td style={{ padding: '6px', textAlign: 'right' }}>{toUsd.format(r.yearlyAverage)}</td>
                    <td style={{ padding: '6px', textAlign: 'right' }}>{Number(r.btcBought).toFixed(8)}</td>
                    <td style={{ padding: '6px', textAlign: 'right' }}>{toUsd.format(r.currentValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{ marginTop: 12 }}>
            <p>
              Total Invested: <strong>{toUsd.format(result.totals.totalInvested)}</strong>
            </p>
            <p>
              Total BTC: <strong>{Number(result.totals.totalBTC).toFixed(8)} BTC</strong>
            </p>
            <p>
              Current Price: <strong>{toUsd.format(result.meta.currentPrice)}</strong>
            </p>
            <p>
              Current Value: <strong>{toUsd.format(result.totals.totalCurrentValue)}</strong>
            </p>
            <p>
              ROI: <strong>{toUsd.format(result.totals.returnOnInvestment)}</strong> ({Number(result.totals.returnPercentage).toFixed(2)}%)
            </p>
            <p>
              Avg Cost Basis: <strong>{toUsd.format(result.totals.avgCostBasis)}</strong>
            </p>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#bbb' }}>
            Sources: Backend proxy (if available), CoinGecko (daily prices), CryptoCompare (fallback), CoinDesk/Blockchain.info (current price fallback)
          </p>
        </div>
      )}
    </div>
  );
};

export default InvestmentCalculator;
