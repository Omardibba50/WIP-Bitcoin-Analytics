import React, { useMemo, useRef, useState } from 'react';
import { apiClient, priceApi } from '../services/apiClient';
import { Card } from './ui';
import styles from './InvestmentCalculator.module.css';

const InvestmentCalculator = () => {
  const [mode, setMode] = useState('historical'); // 'historical' or 'forecast'
  const [investmentEntries, setInvestmentEntries] = useState([
    { year: '', amount: '' },
  ]);
  const [forecastAmount, setForecastAmount] = useState('');
  const [forecastHorizon, setForecastHorizon] = useState('24h');
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
    // 1) Prefer backend price (more reliable, avoids browser CORS/rate limits)
    try {
      const resp = await priceApi.getLatest('BTC');
      const row = resp?.data ?? resp;
      const val = Number(row?.price);
      if (Number.isFinite(val)) return val;
    } catch (_) {}

    // 2) Try CoinGecko
    try {
      const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';
      const resp = await fetch(url);
      if (resp.ok) {
        const json = await resp.json();
        const val = Number(json?.bitcoin?.usd);
        if (Number.isFinite(val)) return val;
      }
    } catch (_) {}

    // 3) Try CoinDesk
    try {
      const resp = await fetch('https://api.coindesk.com/v1/bpi/currentprice/USD.json');
      if (resp.ok) {
        const json = await resp.json();
        const val = Number(json?.bpi?.USD?.rate_float);
        if (Number.isFinite(val)) return val;
      }
    } catch (_) {}

    // 4) Try Blockchain.info
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

  const calculateForecastROI = async () => {
    const amount = Number(forecastAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid investment amount.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);

      // Fetch multi-horizon predictions
      const predResp = await apiClient.get('/ai/predictions/latest?multi=1');
      const predictions = predResp?.predictions || predResp?.data?.predictions;
      
      if (!predictions || !predictions[forecastHorizon]) {
        throw new Error('AI predictions not available');
      }

      const pred = predictions[forecastHorizon];
      const currentPrice = Number(pred?.current_price);
      const predictedPrice = Number(pred?.predicted_price);
      const predictedLow = Number(pred?.predicted_low);
      const predictedHigh = Number(pred?.predicted_high);

      if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
        throw new Error('Invalid current price from AI prediction');
      }
      if (!Number.isFinite(predictedPrice) || !Number.isFinite(predictedLow) || !Number.isFinite(predictedHigh)) {
        throw new Error('Invalid predicted prices from AI prediction');
      }

      // Calculate BTC amount
      const btcAmount = amount / currentPrice;

      // Calculate scenarios
      const baseValue = btcAmount * predictedPrice;
      const lowValue = btcAmount * predictedLow;
      const highValue = btcAmount * predictedHigh;

      const baseROI = baseValue - amount;
      const lowROI = lowValue - amount;
      const highROI = highValue - amount;

      const basePercent = (baseROI / amount) * 100;
      const lowPercent = (lowROI / amount) * 100;
      const highPercent = (highROI / amount) * 100;

      setResult({
        mode: 'forecast',
        forecast: {
          amount,
          btcAmount,
          currentPrice,
          horizon: forecastHorizon,
          scenarios: {
            base: { price: predictedPrice, value: baseValue, roi: baseROI, percent: basePercent },
            low: { price: predictedLow, value: lowValue, roi: lowROI, percent: lowPercent },
            high: { price: predictedHigh, value: highValue, roi: highROI, percent: highPercent },
          },
          confidence: Number(pred?.confidence),
          context: pred.context,
        },
      });
    } catch (err) {
      setError(err?.message || 'Failed to calculate forecast ROI. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

    const currentYear = new Date().getFullYear();
    const outOfRange = cleaned.find(r => {
      const y = Number(r.year);
      return !Number.isFinite(y) || y < 2010 || y > currentYear;
    });
    if (outOfRange) {
      setError(`Year out of range: ${outOfRange.year}. Use a year between 2010 and ${currentYear}.`);
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
            const resp = await apiClient.get(`/prices/year-avg/${year}`);
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
    <Card className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>BTC Investment Calculator</h2>
        <div className={styles.modeSelector}>
          <button
            type="button"
            onClick={() => { setMode('historical'); setResult(null); setError(''); }}
            className={`${styles.modeButton} ${mode === 'historical' ? styles.modeButtonActive : ''}`}
          >
            Historical ROI
          </button>
          <button
            type="button"
            onClick={() => { setMode('forecast'); setResult(null); setError(''); }}
            className={`${styles.modeButton} ${mode === 'forecast' ? styles.modeButtonActive : ''}`}
          >
            Forecast ROI
          </button>
        </div>
      </div>

      {mode === 'forecast' ? (
        <>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Investment Details</h3>
            <p className={styles.sectionDescription}>Uses AI prediction ranges (low/base/high) for selected horizon</p>
            <div className={styles.inputGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Investment Amount (USD)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={forecastAmount}
                  onChange={(e) => setForecastAmount(e.target.value)}
                  placeholder="e.g., 10000"
                  className={styles.input}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Forecast Horizon</label>
                <select
                  value={forecastHorizon}
                  onChange={(e) => setForecastHorizon(e.target.value)}
                  className={styles.select}
                >
                  <option value="1h">1 Hour</option>
                  <option value="24h">24 Hours</option>
                  <option value="7d">7 Days</option>
                </select>
              </div>
            </div>
            <button onClick={calculateForecastROI} disabled={loading} className={styles.calculateButton}>
              {loading ? 'Calculating…' : 'Calculate Forecast'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Investment History</h3>
            <p className={styles.sectionDescription}>Enter your investment year(s) and amount(s) to calculate historical ROI</p>
            <div className={styles.entriesContainer}>
              {investmentEntries.map((row, idx) => (
                <div className={styles.entryRow} key={idx}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Year</label>
                    <input
                      type="number"
                      min={2010}
                      max={new Date().getFullYear()}
                      step={1}
                      value={row.year}
                      onChange={(e) => {
                        const v = e.target.value;
                        setInvestmentEntries(prev => prev.map((r, i) => i === idx ? { ...r, year: v } : r));
                      }}
                      placeholder="e.g., 2017"
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Amount (USD)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={row.amount}
                      onChange={(e) => {
                        const v = e.target.value;
                        setInvestmentEntries(prev => prev.map((r, i) => i === idx ? { ...r, amount: v } : r));
                      }}
                      placeholder="e.g., 1000"
                      className={styles.input}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setInvestmentEntries(prev => prev.filter((_, i) => i !== idx))}
                    disabled={investmentEntries.length === 1}
                    className={styles.removeButton}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className={styles.actionButtons}>
              <button type="button" onClick={() => setInvestmentEntries(prev => [...prev, { year: '', amount: '' }])} className={styles.addButton}>
                + Add Year
              </button>
              <button onClick={calculateReturn} disabled={loading} className={styles.calculateButton}>
                {loading ? 'Calculating…' : 'Calculate'}
              </button>
            </div>
          </div>
        </>
      )}
      {error && <div className={styles.error}>{error}</div>}
      
      {result && result.mode === 'forecast' && (
        <div className={styles.resultSection}>
          <h3 className={styles.resultTitle}>Forecast ROI Calculation</h3>
          
          <div className={styles.summaryCard}>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Investment</span>
                <span className={styles.summaryValue}>{toUsd.format(result.forecast.amount)}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>BTC Amount</span>
                <span className={styles.summaryValue}>{result.forecast.btcAmount.toFixed(8)} BTC</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Current Price</span>
                <span className={styles.summaryValue}>{toUsd.format(result.forecast.currentPrice)}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Horizon</span>
                <span className={styles.summaryValue}>{result.forecast.horizon.toUpperCase()}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Confidence</span>
                <span className={styles.summaryValue}>{(result.forecast.confidence * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <h4 className={styles.subsectionTitle}>Projected Scenarios</h4>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.tableHeader}>Scenario</th>
                  <th className={`${styles.tableHeader} ${styles.textRight}`}>Price</th>
                  <th className={`${styles.tableHeader} ${styles.textRight}`}>Value</th>
                  <th className={`${styles.tableHeader} ${styles.textRight}`}>ROI</th>
                  <th className={`${styles.tableHeader} ${styles.textRight}`}>ROI %</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.tableRowBearish}>
                  <td className={styles.tableCell}>Bearish (Low)</td>
                  <td className={`${styles.tableCell} ${styles.textRight}`}>{toUsd.format(result.forecast.scenarios.low.price)}</td>
                  <td className={`${styles.tableCell} ${styles.textRight}`}>{toUsd.format(result.forecast.scenarios.low.value)}</td>
                  <td className={`${styles.tableCell} ${styles.textRight} ${result.forecast.scenarios.low.roi >= 0 ? styles.positive : styles.negative}`}>
                    {toUsd.format(result.forecast.scenarios.low.roi)}
                  </td>
                  <td className={`${styles.tableCell} ${styles.textRight} ${result.forecast.scenarios.low.percent >= 0 ? styles.positive : styles.negative}`}>
                    {result.forecast.scenarios.low.percent.toFixed(2)}%
                  </td>
                </tr>
                <tr className={styles.tableRowBase}>
                  <td className={`${styles.tableCell} ${styles.bold}`}>Base Case</td>
                  <td className={`${styles.tableCell} ${styles.textRight} ${styles.bold}`}>{toUsd.format(result.forecast.scenarios.base.price)}</td>
                  <td className={`${styles.tableCell} ${styles.textRight} ${styles.bold}`}>{toUsd.format(result.forecast.scenarios.base.value)}</td>
                  <td className={`${styles.tableCell} ${styles.textRight} ${styles.bold} ${result.forecast.scenarios.base.roi >= 0 ? styles.positive : styles.negative}`}>
                    {toUsd.format(result.forecast.scenarios.base.roi)}
                  </td>
                  <td className={`${styles.tableCell} ${styles.textRight} ${styles.bold} ${result.forecast.scenarios.base.percent >= 0 ? styles.positive : styles.negative}`}>
                    {result.forecast.scenarios.base.percent.toFixed(2)}%
                  </td>
                </tr>
                <tr className={styles.tableRowBullish}>
                  <td className={styles.tableCell}>Bullish (High)</td>
                  <td className={`${styles.tableCell} ${styles.textRight}`}>{toUsd.format(result.forecast.scenarios.high.price)}</td>
                  <td className={`${styles.tableCell} ${styles.textRight}`}>{toUsd.format(result.forecast.scenarios.high.value)}</td>
                  <td className={`${styles.tableCell} ${styles.textRight} ${result.forecast.scenarios.high.roi >= 0 ? styles.positive : styles.negative}`}>
                    {toUsd.format(result.forecast.scenarios.high.roi)}
                  </td>
                  <td className={`${styles.tableCell} ${styles.textRight} ${result.forecast.scenarios.high.percent >= 0 ? styles.positive : styles.negative}`}>
                    {result.forecast.scenarios.high.percent.toFixed(2)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {result.forecast.context && (
            <div className={styles.contextCard}>
              <h4 className={styles.contextTitle}>Market Context</h4>
              <div className={styles.contextGrid}>
                <div className={styles.contextItem}>
                  <span className={styles.contextLabel}>RSI:</span>
                  <span className={styles.contextValue}>{result.forecast.context.rsi.toFixed(1)} ({result.forecast.context.rsi_state})</span>
                </div>
                <div className={styles.contextItem}>
                  <span className={styles.contextLabel}>Trend:</span>
                  <span className={styles.contextValue}>{result.forecast.context.trend}</span>
                </div>
                <div className={styles.contextItem}>
                  <span className={styles.contextLabel}>Volatility:</span>
                  <span className={styles.contextValue}>{result.forecast.context.volatility.toFixed(2)}% ({result.forecast.context.volatility_regime})</span>
                </div>
              </div>
            </div>
          )}

          <p className={styles.disclaimer}>
            ⚠️ Forecast ROI is based on AI predictions and should not be considered investment advice. 
            Actual results may vary significantly. Past performance does not guarantee future results.
          </p>
        </div>
      )}
      
      {result && result.mode !== 'forecast' && (
        <div className={styles.resultSection}>
          <h3 className={styles.resultTitle}>Historical ROI Result</h3>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.tableHeader}>Year</th>
                  <th className={`${styles.tableHeader} ${styles.textRight}`}>Amount (USD)</th>
                  <th className={`${styles.tableHeader} ${styles.textRight}`}>Avg Price</th>
                  <th className={`${styles.tableHeader} ${styles.textRight}`}>BTC Bought</th>
                  <th className={`${styles.tableHeader} ${styles.textRight}`}>Value Now</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r, i) => (
                  <tr key={i}>
                    <td className={styles.tableCell}>{r.year}</td>
                    <td className={`${styles.tableCell} ${styles.textRight}`}>{toUsd.format(r.amount)}</td>
                    <td className={`${styles.tableCell} ${styles.textRight}`}>{toUsd.format(r.yearlyAverage)}</td>
                    <td className={`${styles.tableCell} ${styles.textRight}`}>{Number(r.btcBought).toFixed(8)}</td>
                    <td className={`${styles.tableCell} ${styles.textRight}`}>{toUsd.format(r.currentValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.totalsSection}>
            <h4 className={styles.subsectionTitle}>Summary</h4>
            <div className={styles.totalsGrid}>
              <div className={styles.totalItem}>
                <span className={styles.totalLabel}>Total Invested</span>
                <span className={styles.totalValue}>{toUsd.format(result.totals.totalInvested)}</span>
              </div>
              <div className={styles.totalItem}>
                <span className={styles.totalLabel}>Total BTC</span>
                <span className={styles.totalValue}>{Number(result.totals.totalBTC).toFixed(8)} BTC</span>
              </div>
              <div className={styles.totalItem}>
                <span className={styles.totalLabel}>Current Price</span>
                <span className={styles.totalValue}>{toUsd.format(result.meta.currentPrice)}</span>
              </div>
              <div className={styles.totalItem}>
                <span className={styles.totalLabel}>Current Value</span>
                <span className={styles.totalValue}>{toUsd.format(result.totals.totalCurrentValue)}</span>
              </div>
              <div className={styles.totalItem}>
                <span className={styles.totalLabel}>ROI</span>
                <span className={`${styles.totalValue} ${result.totals.returnOnInvestment >= 0 ? styles.positive : styles.negative}`}>
                  {toUsd.format(result.totals.returnOnInvestment)} ({Number(result.totals.returnPercentage).toFixed(2)}%)
                </span>
              </div>
              <div className={styles.totalItem}>
                <span className={styles.totalLabel}>Avg Cost Basis</span>
                <span className={styles.totalValue}>{toUsd.format(result.totals.avgCostBasis)}</span>
              </div>
            </div>
          </div>

          <p className={styles.disclaimer}>
            Sources: Backend proxy (if available), CoinGecko (daily prices), CryptoCompare (fallback), CoinDesk/Blockchain.info (current price fallback)
          </p>
        </div>
      )}
    </Card>
  );
};

export default InvestmentCalculator;
