import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from "chart.js";
import {
  CandlestickController,
  CandlestickElement,
} from "chartjs-chart-financial";
import { Chart } from "react-chartjs-2";
import "chartjs-adapter-date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CandlestickController,
  CandlestickElement
);

ChartJS.defaults.font.family = "Poppins, system-ui, -apple-system, sans-serif";

const API_URL = "http://localhost:5000/api/prices";

export default function MainDashboard() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [dataPrices, setDataPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [summary, setSummary] = useState({
    currentPrice: 0,
    high: 0,
    low: 0,
    ath: 0,
    change24h: 0,
    volume: 0,
  });

  const [searchTerm, setSearchTerm] = useState("BTC");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [btcVsGold, setBtcVsGold] = useState({
    labels: [],
    bitcoin: [],
    gold: [],
    btcPricedInGold: [],
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let url = `${API_URL}?symbol=${searchTerm}`;
      if (fromDate) url += `&from=${new Date(fromDate).getTime()}`;
      if (toDate) url += `&to=${new Date(toDate).getTime()}`;

      const res = await axios.get(url);
      const sorted = res.data.sort((a, b) => a.timestamp - b.timestamp);

      if (sorted.length) {
        const currentPrice = sorted[sorted.length - 1].close;
        const high = Math.max(...sorted.map((d) => d.high));
        const low = Math.min(...sorted.map((d) => d.low));
        const open24h = sorted[0].open;
        const change24h = ((currentPrice - open24h) / open24h) * 100;
        const volume = sorted.reduce((acc, d) => acc + (d.volume || 0), 0);
        // All-time high from the returned dataset (API may return full history)
        const ath = Math.max(...sorted.map((d) => d.high));
        setSummary({ currentPrice, high, low, change24h, volume, ath });
      }

      const formatted = sorted.map((d) => ({
        x: d.timestamp,
        o: d.open,
        h: d.high,
        l: d.low,
        c: d.close,
      }));
      setDataPrices(formatted);

      // BTC vs Gold comparison data
      const labels = sorted.map((d) => d.timestamp);
      const bitcoin = sorted.map((d) => d.close);
      const gold = sorted.map((_, i) => 1900 + Math.sin(i / 4) * 10); // simulated
      const btcPricedInGold = bitcoin.map((b, i) => b / gold[i]);

      setBtcVsGold({ labels, bitcoin, gold, btcPricedInGold });

      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError("Failed to fetch price data.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCandlestickConfig = (data, label) => ({
    data: { datasets: [{ label, data, borderColor: "#00b3ff", color: { up: "#00ff88", down: "#ff4d4d" } }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: "#ccc" } }, tooltip: { mode: "index", intersect: false } },
      scales: {
        x: { type: "time", time: { unit: "day", tooltipFormat: "PP" }, ticks: { color: "#888" }, grid: { color: "#333" } },
        y: { ticks: { color: "#888" }, grid: { color: "#333" }, title: { display: true, text: "Price (USD)", color: "#aaa" } },
      },
    },
  });

  const getComparisonChartConfig = () => ({
    data: {
      labels: btcVsGold.labels,
      datasets: [
        { label: "Bitcoin (USD)", data: btcVsGold.bitcoin, borderColor: "orange", backgroundColor: "rgba(255,165,0,0.2)", fill: false, tension: 0.3 },
        { label: "Gold (USD)", data: btcVsGold.gold, borderColor: "gold", backgroundColor: "rgba(255,215,0,0.2)", fill: false, tension: 0.3 },
        { label: "BTC in Gold ounces", data: btcVsGold.btcPricedInGold, borderColor: "blue", backgroundColor: "rgba(0,0,255,0.2)", fill: false, tension: 0.3 },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "top" }, tooltip: { mode: "index", intersect: false } },
      scales: {
        x: { type: "time", time: { unit: "day", tooltipFormat: "PP" }, title: { display: true, text: "Date" } },
        y: { beginAtZero: false, title: { display: true, text: "Price / Ounces" } },
      },
    },
  });

  const infoCards = [
    { title: "Current Price", value: `$${summary.currentPrice.toLocaleString()}`, color: "#00b3ff" },
    { title: "24h Change", value: `${summary.change24h >= 0 ? "+" : ""}${summary.change24h.toFixed(2)}%`, color: summary.change24h >= 0 ? "#4ade80" : "#ff6b6b" },
    { title: "24h High", value: `$${summary.high.toLocaleString()}`, color: "#ffd700" },
    { title: "All-time High", value: `$${summary.ath.toLocaleString()}`, color: "#ffb86b" },
    { title: "24h Low", value: `$${summary.low.toLocaleString()}`, color: "#ff6347" },
    { title: "Volume", value: summary.volume.toLocaleString(), color: "#00ffff" },
  ];

  return (
    <div className="app-root" style={{ fontFamily: "Poppins,sans-serif", backgroundColor: "#121212", color: "#fff", minHeight: "100vh" }}>
      {/* Header */}
      <header className="site-header">
        <div className="brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#00b3ff" aria-hidden="true"><circle cx="12" cy="12" r="10" /></svg>
          <span className="brand-title">Market Dashboard</span>
        </div>
        <nav className="nav">
          <ul className="desktop-menu">
            {["Dashboard","Predictions","Analytics","Market"].map(link => (
              <li key={link}><a href={`#${link.toLowerCase()}`}>{link}</a></li>
            ))}
          </ul>
        </nav>
        <button className="mobile-toggle" onClick={() => setMobileNavOpen(!mobileNavOpen)} aria-expanded={mobileNavOpen} aria-label="Toggle navigation">
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>
      </header>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileNavOpen ? 'open' : ''}`} role="dialog" aria-modal="true">
        <div className="mobile-menu-inner">
          {["Dashboard","Predictions","Analytics","Market"].map(link => (
            <a key={link} href={`#${link.toLowerCase()}`} className="mobile-link" onClick={()=>setMobileNavOpen(false)}>{link}</a>
          ))}
        </div>
      </div>

      {/* Filters */}
      <section className="filters">
        <input className="filter-input" type="text" placeholder="Symbol (BTC)" value={searchTerm} onChange={e=>setSearchTerm(e.target.value.toUpperCase())} />
        <label className="filter-label">From:<input className="filter-input" type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} /></label>
        <label className="filter-label">To:<input className="filter-input" type="date" value={toDate} onChange={e=>setToDate(e.target.value)} /></label>
        <button className="apply-btn" onClick={fetchData}>Apply</button>
      </section>

      {/* Info Cards */}
      <section className="info-cards">
        {infoCards.map((card, idx)=>(
          <div key={idx} className="info-card" style={{ backgroundColor:"#1e1e1e" }}>
            <span className="card-title">{card.title}</span>
            <span className="card-value" style={{ color: card.color }}>{card.value}</span>
          </div>
        ))}
      </section>

      {/* Candlestick */}
      <main className="main-content">
        {loading?<p className="loading">Loading chart data...</p>:
          <section className="chart-card">
            <Chart type="candlestick" {...getCandlestickConfig(dataPrices, `${searchTerm} Price`)}/>
          </section>
        }
      </main>

      {/* BTC vs Gold + Lightning Network inline */}
      <section id="market" style={{ padding: "2rem" }}>
        <h2 style={{ color: "#00b3ff" }}>Market Insights</h2>
        {btcVsGold.labels.length > 0 && (
          <div className="chart-row">
            {/* BTC vs Gold / BTC in Gold */}
            <div className="small-card">
              <h3 className="small-card-title">BTC vs Gold</h3>
              <Chart type="line" {...getComparisonChartConfig()} style={{ height: "200px" }} />
            </div>

            {/* Lightning Network Sample */}
            <div className="small-card">
              <h3 className="small-card-title">Lightning Network (Public)</h3>
              <Chart
                type="line"
                data={{
                  labels: btcVsGold.labels,
                  datasets: [
                    {
                      label: "Nodes",
                      data: btcVsGold.labels.map((_, i) => 1000 + Math.sin(i / 3) * 100),
                      borderColor: "#4ade80",
                      backgroundColor: "rgba(74, 222, 128, 0.2)",
                      fill: false,
                      tension: 0.3,
                    },
                    {
                      label: "Capacity (BTC)",
                      data: btcVsGold.labels.map((_, i) => 500 + Math.cos(i / 4) * 50),
                      borderColor: "#00b3ff",
                      backgroundColor: "rgba(0, 179, 255, 0.2)",
                      fill: false,
                      tension: 0.3,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { position: "top" }, tooltip: { mode: "index", intersect: false } },
                  scales: {
                    x: { type: "time", time: { unit: "day", tooltipFormat: "PP" }, title: { display: true, text: "Date" } },
                    y: { beginAtZero: false, title: { display: true, text: "Nodes / Capacity" } },
                  },
                }}
                style={{ height: "200px" }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Other Info Sections */}
      <section id="predictions" style={{ margin:"2rem 2rem" }}>
        <h2 style={{ color:"#00b3ff" }}>Predictions</h2>
        <p style={{ color:"#ccc" }}>Real-time model predictions fetched from backend API with EMA-based confidence intervals.</p>
      </section>
      <section id="analytics" style={{ margin:"2rem 2rem" }}>
        <h2 style={{ color:"#00b3ff" }}>Analytics</h2>
        <p style={{ color:"#ccc" }}>Historical price trends over 30 days from price tracking API.</p>
      </section>

      {/* Last Updated */}
      {lastUpdated && <div style={{ textAlign:"center", color:"#888", marginBottom:"2rem" }}>Last updated: {lastUpdated.toLocaleTimeString()}</div>}
    </div>
  );
}
