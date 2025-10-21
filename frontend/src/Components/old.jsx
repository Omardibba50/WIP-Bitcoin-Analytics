import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Chart as ChartJS, CategoryScale, LinearScale, TimeScale, Tooltip, Legend, LineElement, PointElement } from "chart.js";
import { CandlestickController, CandlestickElement } from "chartjs-chart-financial";
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

export default function MainDashboardHistorical() {
  const [dataPrices, setDataPrices] = useState([]);
  const [btcVsGold, setBtcVsGold] = useState({ labels: [], bitcoin: [], gold: [], btcPricedInGold: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("BTC");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_URL}?symbol=${searchTerm}`);
      const sorted = res.data.sort((a, b) => a.timestamp - b.timestamp);

      const formatted = sorted.map((d) => ({ x: d.timestamp, o: d.open, h: d.high, l: d.low, c: d.close }));
      setDataPrices(formatted);

      const labels = sorted.map((d) => d.timestamp);
      const bitcoin = sorted.map((d) => d.close);
      const gold = sorted.map((_, i) => 1900 + Math.sin(i / 4) * 10);
      const btcPricedInGold = bitcoin.map((b, i) => b / gold[i]);
      setBtcVsGold({ labels, bitcoin, gold, btcPricedInGold });
    } catch (err) {
      setError("Failed to fetch price data.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Candlestick & comparison chart configs
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

  if (error) return <div>{error}</div>;
  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>BTC Candlestick Chart</h2>
      <div style={{ height: "500px", backgroundColor: "#1e1e1e", borderRadius: "12px" }}>
        <Chart type="candlestick" {...getCandlestickConfig(dataPrices, `${searchTerm} Price`)} />
      </div>

      {/* BTC vs Gold & Market Insights charts */}
      {/* You can reuse your chart configs here */}
    </div>
  );
}
