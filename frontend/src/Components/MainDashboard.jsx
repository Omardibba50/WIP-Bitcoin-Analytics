import React, { useState, useEffect, useCallback } from 'react';
import { Chart as ChartComponent, Line, Bar } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Chart as ChartJS, LineElement, BarElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, ArcElement, TimeScale } from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns';
import BlockchainBlocks from './BlockchainBlocks';
import CorporateTreasuries from './CorporateTreasuries';
import BitcoinMetrics from './BitcoinMetrics';
import PriceCards from './PriceCards';
import PriceChart from './PriceChart';
import ModelChart from './ModelChart';
import MiningEconomics from './MiningEconomics';
import PredictedNextBlock from './PredictedNextBlock';
import LiveModelsChart from "./LiveModelsChart";
import PricePerformanceChart from "./PricePerformanceChart";
import { priceApi, modelApi, predictionApi } from '../services/api';

ChartJS.register(
    LineElement, BarElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, ArcElement, TimeScale,
    CandlestickController, CandlestickElement
);

const dateToTimestamp = (date) => (date ? date.getTime() : null);

// API Base URL
// Use centralized API base via services/api.js; remove hardcoded base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

// Keep legacy API service for compatibility with existing code
const apiService = {
    async getPriceSummary(symbol = 'BTC') {
        const data = await priceApi.getSummary(symbol);
        return { data };
    },
    async getPriceHistory(symbol = 'BTC', from, to, limit = 500) {
        const data = await priceApi.getHistory(symbol, from, to, limit);
        return { data };
    },
    async getCoinDeskPriceData() {
        // Proxy through backend endpoint for CoinDesk candles
        const response = await fetch(`${API_BASE_URL}/CoinDeskprices`);
        if (!response.ok) throw new Error('Failed to fetch CoinDesk prices');
        return response.json();
    },
    async getModels() {
        const data = await modelApi.getAll();
        return { data };
    },
    async getPredictions(modelId, symbol = 'BTC') {
        const data = await predictionApi.getByModel(modelId, symbol);
        return { data };
    },
    async getLightningNetworkStats() {
        const response = await fetch(`${API_BASE_URL}/lightning/stats`);
        if (!response.ok) throw new Error('Failed to fetch Lightning Network stats');
        return response.json();
    },
    async getChainSecurityMetrics(from, to) {
        // Try backend first
        try {
            const url = `${API_BASE_URL}/metrics/hashrate?from=${from || ''}&to=${to || ''}`;
            const res = await fetch(url);
            if (res.ok) return res.json();
        } catch (_) {}
        // Fallback: blockchain.com public API (may have CORS restrictions)
        try {
            const res = await fetch(`${API_BASE_URL}/proxy/hashrate?timespan=60days`);
            if (res.ok) {
                const json = await res.json();
                return { data: json.data || [] };
            }
        } catch (_) {}
        return { data: [] };
    },
    async getAllTimeHigh(symbol = 'BTC') {
        const response = await fetch(`${API_BASE_URL}/prices/ath?symbol=${symbol}`);
        if (!response.ok) throw new Error('Failed to fetch all-time high');
        return response.json(); // Already has {data: ...} format from backend
    }
};

// --- Custom Styles for Responsiveness and Dark Theme (REVISED FOR ALL SIZING) ---
const customStyles = `
/* Global and Base Styles */
.dashboard-bg {
    background-color: #0f0f0f;
    min-height: 100vh;
    color: white;
    font-family: system-ui, -apple-system, sans-serif;
}
.main-header {
    background: #1a1a1a;
    padding: 1.25rem 1rem;
    border-bottom: 1px solid rgba(0, 179, 255, 0.1);
    position: sticky;
    top: 0;
    z-index: 100;
}
.main-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1400px;
    margin: 0 auto;
}
.main-content {
    padding: 1.5rem 1rem;
    max-width: 1400px;
    margin: 0 auto;
}
.section-card {
    background-color: #ffffff;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #333;
}

/* Chart Sizing: Controlled via CSS, overridden by media query */
.chart-container-lg {
    height: 350px; /* Standard Desktop Height for Main Chart */
}
.chart-container-sm {
    height: 250px; /* Standard Desktop Height for Sub-Charts */
}

/* Control Row: Flexbox for single-row layout on desktop */
.control-row {
    display: flex;
    flex-wrap: wrap; /* Allows wrapping */
    gap: 0.75rem;
    align-items: center;
    margin-bottom: 1.5rem;
    background-color: #1a1a1a;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid #333;
}
.control-row-label {
    color: #ccc;
    white-space: nowrap;
    font-size: 0.9rem;
    flex-shrink: 0;
}
/* Ensure all inputs and buttons have a consistent height and padding */
.control-row input, .control-row button {
    box-sizing: border-box;
    font-size: 0.9rem;
    height: 38px; /* Set a consistent height */
    padding: 0.4rem 0.6rem; 
    flex-grow: 1; /* Default to grow */
    min-width: 80px;
}

/* Datepicker & Symbol Input Styling */
.custom-input {
    background-color: #333;
    border: 1px solid #555;
    border-radius: 4px;
    color: white;
}
/* Specific style for the Symbol Input (Search Box) */
.symbol-input {
    flex-grow: 2; /* KEY: Makes the search box wider than date pickers */
    min-width: 150px; 
    max-width: 300px; 
}
/* Specific style for Datepickers */
.datepicker-input {
    width: 100%;
}
.datepicker-wrapper {
    flex-grow: 1; /* Allows date pickers to grow equally */
    min-width: 130px; 
    max-width: 160px; /* Max width for datepicker wrapper */
}
/* Ensure the button is a fixed size and matches height */
.apply-button {
    flex-grow: 0;
    flex-shrink: 0;
    width: 80px; /* Fixed width */
    align-self: stretch; /* Stretch vertically to match input height (38px) */
    font-weight: bold;
    padding: 0 1rem;
}

/* Tile Grid - Uses CSS Grid for fluid layout */
.tiles-grid {
    display: grid;
    /* auto-fit and minmax ensures fluid column sizing that wraps */
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); 
    gap: 1rem;
    margin-bottom: 1.5rem;
}

/* Prediction Cards Flex Scroll */
.predictions-scroll-container {
    display: flex;
    gap: 0.75rem;
    overflow-x: auto; /* KEY: Enables horizontal scroll on overflow */
    padding-bottom: 0.5rem;
}
.prediction-card {
    min-width: 180px; /* Prevents cards from collapsing too small */
    padding: 0.75rem;
    border: 1px solid #333;
    border-radius: 6px;
    background-color: #222;
    flex-shrink: 0; /* Prevents cards from shrinking */
}

/* Media Queries for Mobile Optimizations */
@media (max-width: 768px) {
    /* Header/Nav Stack */
    .main-nav {
        flex-direction: column;
        align-items: flex-start;
    }
    .main-nav ul {
        margin-top: 0.5rem !important;
        gap: 0.75rem !important;
    }

    /* Control Row Stack */
    .control-row {
        flex-direction: column;
        align-items: stretch; /* Forces items to full width */
    }
    .control-row-label {
        align-self: flex-start;
        margin-bottom: -0.25rem;
    }
    /* Full width override for all controls on small screens */
    .control-row input, .datepicker-wrapper, .control-row button, .symbol-input {
        max-width: 100% !important;
        width: 100% !important;
        flex-grow: 1 !important; 
    }
    .apply-button {
        width: 100% !important; 
    }
    
    /* Smaller Chart Sizes on Mobile */
    .chart-container-lg {
        height: 250px;
    }
    .chart-container-sm {
        height: 200px;
    }
    /* Tighter tile grid on mobile */
    .tiles-grid {
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    }

    /* ===== FOOTER STYLES ===== */
.dashboard-footer {
  background-color: #1a1a1a;
  color: white;
  text-align: center;
  padding: 1rem;
  margin-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 0.95rem;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.dashboard-footer a {
  color: white;
  text-decoration: underline;
}

.dashboard-footer a:hover {
  text-decoration: none;
  opacity: 0.9;
}
}

`;



// --- Main Dashboard Component ---

function MainDashboard() {
    // Shared State
    const [searchTerm, setSearchTerm] = useState('BTC');
    const [tempSearchTerm, setTempSearchTerm] = useState('BTC');
    const [startDate, setStartDate] = useState(new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)));
    const [endDate, setEndDate] = useState(new Date());

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');

    // Data State (Consolidated)
    const [priceSummary, setPriceSummary] = useState(null);
    const [predictions, setPredictions] = useState([]);
    const [models, setModels] = useState([]);
    const [allTimeHigh, setAllTimeHigh] = useState(null);
    const [mainChartOHLCData, setMainChartOHLCData] = useState([]);
    const [btcVsGold, setBtcVsGold] = useState({ labels: [], bitcoin: [], gold: [], btcPricedInGold: [] });
    const [lightningStats, setLightningStats] = useState(null);
    const [lnCapacityHistory, setLnCapacityHistory] = useState([]);
    const [hashRateHistory, setHashRateHistory] = useState([]);

    // Fetch all data
    const fetchData = useCallback(async () => {
        setSearchTerm(tempSearchTerm);

        try {
            setLoading(true);
            setError(null);

            const fromTimestamp = dateToTimestamp(startDate);
            const toTimestamp = dateToTimestamp(endDate);

            // Fetch Data Calls...
            const summaryData = await apiService.getPriceSummary(tempSearchTerm);
            setPriceSummary(summaryData.data);
            const athData = await apiService.getAllTimeHigh(tempSearchTerm);
            setAllTimeHigh(athData.data || null);

            const historyData = await apiService.getPriceHistory(tempSearchTerm, fromTimestamp, toTimestamp, 500);
            const history = historyData.data || [];
            
               //  BTC vs Gold Comparison — fully aligned (historical + live + forward-filled)
            const labels = history.map(d => d.ts || d.timestamp);
            const bitcoin = history.map(d => d.price);
           
                try {
                //  Prepare BTC labels & prices
                const labelsFromBTC = history.map(d =>
                    new Date(d.ts || d.timestamp).toISOString().split("T")[0]
                );
                const bitcoinRaw = history.map(d => d.price);

                //  Fetch 90-day historical gold data
                const histRes = await fetch(`${API_BASE_URL}/proxy/gold-xauusd`);
                const histJson = await histRes.json();
                let records = histJson.data || [];

                // Fetch latest live gold price
                const liveRes = await fetch(`${API_BASE_URL}/proxy/gold-live`);
                if (liveRes.ok) {
                    const liveJson = await liveRes.json();
                    const live = liveJson.data?.[0];
                    if (live && !records.find(r => r.timestamp === live.timestamp)) {
                    records.push(live); // add today's live price if missing
                    }
                }

                // 4Merge all unique dates from BTC + Gold
                const labelsFromGold = records.map(r => r.timestamp);
                const allDates = Array.from(new Set([...labelsFromBTC, ...labelsFromGold])).sort(
                    (a, b) => new Date(a) - new Date(b)
                );

                // 5Forward-fill BTC prices
                let lastBTC = bitcoinRaw[0];
                const bitcoinFilled = allDates.map(ts => {
                    const match = history.find(
                    d => new Date(d.ts || d.timestamp).toISOString().split("T")[0] === ts
                    );
                    if (match && match.price) lastBTC = match.price;
                    return lastBTC;
                });

                //  Forward-fill Gold prices
                const goldMap = new Map(records.map(r => [r.timestamp, r.price]));
                let lastGold = records[0]?.price || null;
                const goldFilled = allDates.map(ts => {
                    const g = goldMap.get(ts);
                    if (g != null) lastGold = g;
                    return lastGold;
                });

                // 7Compute BTC priced in Gold
                const btcPricedInGold = allDates.map((ts, i) => {
                    const b = bitcoinFilled[i];
                    const g = goldFilled[i];
                    return b && g ? b / g : null;
                });

                
                //  Limit chart view to the most recent 30 days
                    const DAYS_TO_SHOW = 30;
                    const total = allDates.length;
                    const startIndex = Math.max(total - DAYS_TO_SHOW, 0);

                    const recentLabels = allDates.slice(startIndex);
                    const recentBTC = bitcoinFilled.slice(startIndex);
                    const recentGold = goldFilled.slice(startIndex);
                    const recentBTCinGold = btcPricedInGold.slice(startIndex);

                    setBtcVsGold({
                    labels: recentLabels,
                    bitcoin: recentBTC,
                    gold: recentGold,
                    btcPricedInGold: recentBTCinGold,
                    });

                    console.log(
                    ` Showing last ${DAYS_TO_SHOW} days on chart (${recentLabels[0]} → ${recentLabels[recentLabels.length - 1]})`
                    );


                console.log(
                    " BTC vs Gold aligned dataset:",
                    allDates.length,
                    "points",
                    `(${allDates[0]} → ${allDates[allDates.length - 1]})`
                );
            } catch (err) 
            {
                console.error("BTC vs Gold fetch error:", err);
                setBtcVsGold({ labels: [], bitcoin: [], gold: [], btcPricedInGold: [] });
            }



            // Fetch Candlestick/OHLC Data from CoinDesk API
            const coinDeskData = await apiService.getCoinDeskPriceData();
            const formattedOHLC = coinDeskData
                .sort((a, b) => a.timestamp - b.timestamp)
                .map(d => ({
                    x: d.timestamp,
                    o: d.open,
                    h: d.high,
                    l: d.low,
                    c: d.close,
                }));
            setMainChartOHLCData(formattedOHLC);

            // Fetch Lightning Network stats
            try {
                const lnData = await apiService.getLightningNetworkStats();
                const stats = lnData.data || null;
                setLightningStats(stats);
                // Derive capacity history if available
                if (stats && Array.isArray(stats.capacityHistory)) {
                    const filtered = stats.capacityHistory
                        .map(d => ({ timestamp: d.timestamp || d.ts || d.time, capacity: d.capacity || d.value || d.btc }))
                        .filter(d => d.timestamp)
                        .filter(d => (!fromTimestamp || d.timestamp >= fromTimestamp) && (!toTimestamp || d.timestamp <= toTimestamp));
                    setLnCapacityHistory(filtered);
                } else {
                    setLnCapacityHistory([]);
                }
            } catch (err) {
                console.warn('Lightning Network data not available:', err.message);
                setLightningStats(null);
                setLnCapacityHistory([]);
            }

            const hashData = await apiService.getChainSecurityMetrics(fromTimestamp, toTimestamp);
            setHashRateHistory((hashData.data || []).filter(d => (!fromTimestamp || d.timestamp >= fromTimestamp) && (!toTimestamp || d.timestamp <= toTimestamp)));

            try {
                const modelsData = await apiService.getModels();
                setModels(modelsData.data || []);
            } catch (err) { console.warn('Models not available:', err.message); }

            try {
                const predictionsData = await apiService.getPredictions('ema_24h', tempSearchTerm);
                setPredictions(predictionsData.data || []);
            } catch (err) { console.warn('Predictions not available:', err.message); }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [tempSearchTerm, startDate, endDate]);

    // Initial load and Polling
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        fetchData();
    };

    // --- Chart Configs (Minimized for brevity, assuming internal Chart.js responsiveness is handled) ---

    // Generic Line Chart Config for the new single-line subgraphs
    const getSingleLineChartConfig = (data, valueKey, label, color) => ({
        data: {
            datasets: [
                {
                    label,
                    data: data.map(d => ({ x: d.timestamp, y: d[valueKey] })),
                    borderColor: color,
                    backgroundColor: `${color}40`,
                    fill: 'origin',
                    tension: 0.4,
                    pointRadius: 0,
                },
            ],
        },
        options: {
            responsive: true, maintainAspectRatio: false, // KEY for responsiveness
            plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false } },
            scales: {
                x: { type: 'time', time: { unit: 'day' }, ticks: { color: '#888' }, grid: { color: '#333' } },
                y: { ticks: { color: '#888' }, grid: { color: '#333' }, title: { display: true, text: label, color: '#aaa' } },
            },
        },
    });

    const getCandlestickConfig = (data, label) => ({
        data: {
            datasets: [
                {
                    label,
                    data,
                    type: 'candlestick',
                    borderColor: "#00b3ff",
                    color: { up: "#08f05dff", down: "#f50808ff" },
                },
            ],
        },
        options: {
            responsive: true, maintainAspectRatio: false, // KEY for responsiveness
            plugins: { legend: { labels: { color: "#ccc" } }, tooltip: { mode: "index", intersect: false } },
            scales: {
                x: { type: 'time', time: { unit: 'day' }, ticks: { color: '#888' }, grid: { color: '#333' } },
                y: { ticks: { color: '#888' }, grid: { color: '#333' }, title: { display: true, text: `Price (${searchTerm})`, color: '#aaa' } },
            },
        },
    });

    const getComparisonChartConfig = () => ({
        data: {
            datasets: [
                { label: `${searchTerm} (USD)`, data: btcVsGold.bitcoin.map((price, i) => ({ x: btcVsGold.labels[i], y: price })), borderColor: "#00b3ff", backgroundColor: "rgba(0,179,255,0.2)", fill: false, tension: 0.3, yAxisID: 'y' },
                { label: "Gold (USD)", data: btcVsGold.gold.map((price, i) => ({ x: btcVsGold.labels[i], y: price })), borderColor: "gold", backgroundColor: "rgba(255,215,0,0.2)", fill: false, tension: 0.3, yAxisID: 'y' },
                { label: `${searchTerm} in Gold (oz)`, data: btcVsGold.btcPricedInGold.map((ratio, i) => ({ x: btcVsGold.labels[i], y: ratio })), borderColor: "#4ade80", backgroundColor: "rgba(74,222,128,0.2)", fill: false, tension: 0.3, yAxisID: 'y1' },
            ],
        },
        options: {
            responsive: true, maintainAspectRatio: false, // KEY for responsiveness
            plugins: { legend: { position: "top", labels: { color: "#ccc" } } },
            scales: {
                x: { type: 'time', time: { unit: 'day' }, ticks: { color: '#888' }, grid: { color: '#333' } },
                y: { beginAtZero: false, position: 'left', ticks: { color: '#00b3ff' }, grid: { color: '#333' }, title: { display: true, text: "Price (USD)", color: '#00b3ff' } },
                y1: { beginAtZero: true, position: 'right', ticks: { color: '#4ade80' }, grid: { display: false }, title: { display: true, text: "Ratio (BTC/Gold)", color: '#4ade80' } },
            },
        },
    });


    // --- Display Calculations & Tile Data (unchanged) ---
    const get24hChangeDisplay = () => {
        if (!priceSummary || priceSummary.change24hPct == null) return { value: '—', isNegative: false };
        const changePercent = (priceSummary.change24hPct * 100).toFixed(2);
        const isNegative = priceSummary.change24hPct < 0;
        return { value: `${isNegative ? '' : '+'}${changePercent}%`, isNegative };
    };

    const getPredictedPrice = () => {
        if (!predictions.length) return '—';
        const latestPrediction = predictions[predictions.length - 1];
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(latestPrediction.predicted_price);
    };

    const change24h = get24hChangeDisplay();
    const currentPriceFormatted = priceSummary ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(priceSummary.currentPrice) : '—';

    // Card tile data
    const tiles = [
        { title: 'CURRENT PRICE', value: currentPriceFormatted, type: 'normal' },
        { title: '24 HRS PERFORMANCE', value: change24h.value, type: change24h.isNegative ? 'negative' : 'positive' },
        { title: 'PREDICTED PRICE', value: getPredictedPrice(), type: 'accent' },
        { title: 'ALL-TIME HIGH', value: allTimeHigh ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(allTimeHigh.price) : '—', type: 'accent' },
        { title: 'DISTANCE FROM ATH', value: (allTimeHigh && priceSummary) ? `${((priceSummary.currentPrice - allTimeHigh.price) / allTimeHigh.price * 100).toFixed(2)}%` : '—', type: (allTimeHigh && priceSummary && priceSummary.currentPrice < allTimeHigh.price) ? 'negative' : 'positive' },
        { title: 'MODELS LOADED', value: models.length.toString(), type: 'info' },
    ];


    if (error) {
        // Error display
        return (
            <div className="dashboard-bg" style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ color: '#ff6b6b' }}>Error Loading Dashboard </h2>
                <p>{error}</p>
                <p style={{ color: '#888', marginTop: '1rem' }}>Make sure your backend server is running at <strong>{API_BASE_URL}</strong></p>
                <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1rem', backgroundColor: '#00b3ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '1rem' }}>Retry</button>
            </div>
        );
    }

    return (
        <div className="dashboard-bg">
            <style>{customStyles}</style> {/* Injecting responsive styles */}

            {/* Header: Sticky navigation */}
            <header className="main-header">
                <nav className="main-nav">
                    <div className="logo-section" style={{ fontSize: '1.3rem', fontWeight: '700', color: '#ffffff' }}> {searchTerm} Analytics </div>

                    {/* Menu Layout */}
                    <ul style={{ display: 'flex', gap: '1.5rem', listStyle: 'none', margin: 0, padding: 0 }}>
                        {['dashboard', 'metrics', 'blocks', 'holdings'].map(tab => (
                            <li key={tab}>
                                <button onClick={() => setActiveTab(tab)} style={{
                                    background: 'none',
                                    border: 'none',
                                    color: activeTab === tab ? '#eff2f3ff' : '#ccc',
                                    cursor: 'pointer',
                                    padding: '0.5rem 0',
                                    fontSize: '0.95rem',
                                    borderBottom: activeTab === tab ? '2px solid #00b3ff' : '2px solid transparent',
                                    transition: 'all 0.2s',
                                    textTransform: 'capitalize'
                                }}>
                                    {tab}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </header>

            <main className="main-content">
                {loading && <p style={{ textAlign: 'center', color: '#888' }}>Loading Data... ⏳</p>}

                {/* --- Dashboard Tab Content --- */}
                {activeTab === 'dashboard' && (
                    <>
                        {/* --- REVISED CONTROL ROW (Search and Date Picker) --- */}
                        <form onSubmit={handleFormSubmit} className="control-row">
                            <div className="control-row-label">Filter Price Data:</div>

                            {/* Symbol Input (Search Box) - Uses flex-grow: 2 via CSS for increased width */}
                            <input
                                type="text"
                                placeholder="Symbol"
                                value={tempSearchTerm}
                                onChange={(e) => setTempSearchTerm(e.target.value.toUpperCase())}
                                className="custom-input symbol-input"
                            />

                            {/* Start Date DatePicker - Uses flex-grow: 1 via CSS for uniform size with other date picker */}
                            <DatePicker
                                selected={startDate}
                                onChange={(date) => setStartDate(date)}
                                selectsStart
                                startDate={startDate}
                                endDate={endDate}
                                placeholderText="Start Date"
                                dateFormat="MM/dd/yyyy"
                                className="custom-datepicker"
                                wrapperClassName="datepicker-wrapper"
                                customInput={<input className="custom-input datepicker-input" />}
                            />

                            {/* End Date DatePicker - Uses flex-grow: 1 via CSS for uniform size with other date picker */}
                            <DatePicker
                                selected={endDate}
                                onChange={(date) => setEndDate(date)}
                                selectsEnd
                                startDate={startDate}
                                endDate={endDate}
                                minDate={startDate}
                                placeholderText="End Date"
                                dateFormat="MM/dd/yyyy"
                                className="custom-datepicker"
                                wrapperClassName="datepicker-wrapper"
                                customInput={<input className="custom-input datepicker-input" />}
                            />

                            {/* Apply Button - Fixed width/height via CSS class .apply-button */}
                            <button type="submit" className="apply-button" style={{
                                backgroundColor: '#1fc7d3ff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }}>Apply</button>
                        </form>


                        {/* Price Cards - Refactored Component */}
                        <PriceCards 
                            priceSummary={priceSummary}
                            allTimeHigh={allTimeHigh}
                            predictions={predictions}
                            models={models}
                        />

                        
                        {/* Main Price Chart (Candlestick) */}
                        <section className="section-card" style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: '0 0 0.75rem 0', fontSize: '1.1rem' }}> {searchTerm} Price History (Candlestick) </h2>
                            <div className="chart-container-lg">
                                {mainChartOHLCData && mainChartOHLCData.length > 0 ? (
                                    <ChartComponent
                                        type="candlestick"
                                        data={getCandlestickConfig(mainChartOHLCData, `${searchTerm} Candlestick`).data}
                                        options={getCandlestickConfig(mainChartOHLCData, `${searchTerm} Candlestick`).options}
                                    />
                                ) : (
                                    <div style={{ color: '#0000', textAlign: 'center', padding: '1rem' }}>No candlestick data available.</div>
                                )}
                            </div>
                        </section>

                        {/* Two-Column Charts (Models and BTC vs Gold) - Using grid for responsiveness */}
                        <div className="tiles-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                            {/* 1. Models Chart (Left Subgraph) */}
                            <section className="section-card">
                                <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Available Prediction Models </h3>
                               <div className="chart-container-sm">
                                       <LiveModelsChart />
                                </div>
                            </section>

                            {/* 2. BTC vs Gold Comparison (Right Subgraph) */}
                            <section className="section-card">
                                <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>{searchTerm} vs Gold Comparison </h3>
                                <div className="chart-container-sm">
                                    {(btcVsGold.bitcoin?.length || 0) > 0 ? (
                                        <Line data={getComparisonChartConfig().data} options={getComparisonChartConfig().options} />
                                    ) : (
                                        <div style={{ color: '#0000', textAlign: 'center', padding: '1rem' }}>No comparison data available.</div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Network Metrics Subgraphs - Using the new class for grid responsiveness */}
                        <div className="tiles-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                            {/* 3. Lightning Network Snapshot Card (no chart) */}
                            <section className="section-card">
                                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1rem', letterSpacing: '0.3px' }}>Lightning Network</h3>
                                    <span style={{ color: '#000', fontSize: '0.8rem' }}>Snapshot</span>
                                </div>
                                <div style={{ borderTop: '1px solid #333', margin: '0.25rem 0 0.75rem 0' }} />
                                {lightningStats ? (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                        gap: '0.75rem'
                                    }}>
                                        <div>
                                            <div style={{ color: '#000', fontSize: '0.8rem' }}>Total Capacity</div>
                                            <div style={{ color: '#000', fontWeight: 700 }}>{(lightningStats.totalCapacity ?? 0).toFixed(2)} BTC</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#000', fontSize: '0.8rem' }}>Total Capacity (USD)</div>
                                            <div style={{ color: '#000', fontWeight: 700 }}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(lightningStats.totalCapacityUSD ?? 0)}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#000', fontSize: '0.8rem' }}>Total Nodes</div>
                                            <div style={{ color: '#000', fontWeight: 700 }}>{(lightningStats.totalNodes ?? 0).toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#000', fontSize: '0.8rem' }}>Total Channels</div>
                                            <div style={{ color: '#000', fontWeight: 700 }}>{(lightningStats.totalChannels ?? 0).toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#000', fontSize: '0.8rem' }}>Tor Capacity</div>
                                            <div style={{ color: '#000', fontWeight: 700 }}>{(lightningStats.torCapacity ?? 0).toFixed(2)} BTC</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#000', fontSize: '0.8rem' }}>Tor Nodes</div>
                                            <div style={{ color: '#000', fontWeight: 700 }}>{(lightningStats.torNodes ?? 0).toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#000', fontSize: '0.8rem' }}>Clearnet Nodes</div>
                                            <div style={{ color: '#000', fontWeight: 700 }}>{(lightningStats.clearnetNodes ?? 0).toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#000', fontSize: '0.8rem' }}>Unannounced Nodes</div>
                                            <div style={{ color: '#000', fontWeight: 700 }}>{(lightningStats.unannouncedNodes ?? 0).toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#000', fontSize: '0.8rem' }}>Avg Capacity</div>
                                            <div style={{ color: '#000', fontWeight: 700 }}>{(lightningStats.avgCapacity ?? 0).toFixed(4)} BTC</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#000', fontSize: '0.8rem' }}>Median Capacity</div>
                                            <div style={{ color: '#000', fontWeight: 700 }}>{(lightningStats.medianCapacity ?? 0).toFixed(4)} BTC</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#000', fontSize: '0.8rem' }}>Tor Capacity %</div>
                                            <div style={{ color: '#000', fontWeight: 700 }}>{(lightningStats.torCapacityPercentage ?? 0).toFixed(1)}%</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ color: '#888' }}>No Lightning data available.</div>
                                )}
                            </section>

                            {/* 4. Chain Security (Hash Rate) Chart */}
                            <section className="section-card">
                                <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Hash Rate (Exahashes/s) </h3>
                                <div className="chart-container-sm">
                                    {(hashRateHistory?.length || 0) > 0 ? (
                                        <Line
                                            data={getSingleLineChartConfig(hashRateHistory, 'hashRate', 'Hash Rate (EH/s)', '#4ade80').data}
                                            options={getSingleLineChartConfig(hashRateHistory, 'hashRate', 'Hash Rate (EH/s)', '#4ade80').options}
                                        />
                                    ) : (
                                        <div style={{ color: '#888', textAlign: 'center', padding: '1rem' }}>No hash rate data.</div>
                                    )}
                                </div>
                            </section>
                        </div>
                        <div className="tiles-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                            {/* 5. PricePerformanceChart */}
                            <section className="section-card">
                               <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1rem" }}>Price Performance</h3>
                               <div className="chart-container-sm">
                                  <PricePerformanceChart API_BASE_URL={API_BASE_URL} />
                               </div>
                      
                            </section>
                        </div>
                         

                        {/* Predictions Section - Improved mobile scroll */}
                        {predictions.length > 0 && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <section className="section-card">
                                    <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Latest Predictions </h3>
                                    <div className="predictions-scroll-container">
                                        {predictions.slice(0, 5).map((prediction) => (
                                            <div key={prediction.id || `${prediction.horizon}-${prediction.timestamp || ''}`} className="prediction-card">
                                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff', marginBottom: '0.25rem' }}>
                                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(prediction.predicted_price)}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#ffffffff', marginBottom: '0.5rem' }}>
                                                    Confidence: <strong>{prediction.confidence != null ? (prediction.confidence * 100).toFixed(1) : '—'}%</strong>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#0000' }}> Horizon: {prediction.horizon} </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* Combined Metrics and Holdings Sections */}
                        <h2 style={{ color: '#ffffff', marginTop: '2.5rem', marginBottom: '1rem', fontSize: '1.3rem' }}>Network and Corporate Data</h2>
                        <BitcoinMetrics symbol={searchTerm} />
                        <MiningEconomics />
                        <PredictedNextBlock />
                        <BlockchainBlocks />
                        <CorporateTreasuries />
                    </>
                )}

                {/* --- Other Tabs (Using Child Components) --- */}
                {activeTab === 'metrics' && <BitcoinMetrics symbol={searchTerm} />}
                {activeTab === 'blocks' && <BlockchainBlocks />}
                {activeTab === 'holdings' && <CorporateTreasuries />}

            </main>
            {/* FOOTER SECTION */}
      <footer className="dashboard-footer">
        <p>© {new Date().getFullYear()} BTC predict | All Rights Reserved</p>
        <p>
          Developed by <strong>Pavan Mamidi</strong> •{' '}
          <a
            href="mailto:decentralized.dev@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            decentralized.dev@gmail.com
          </a>{' '}
          |{' '}
          <a
            href="https://github.com/decentralized-dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </p>
      </footer>
        </div>
    );
}

export default MainDashboard;
