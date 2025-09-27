import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

// API service functions
const API_BASE_URL = 'http://localhost:5000/api';

const apiService = {
  async getPriceSummary(symbol = 'BTC') {
    const response = await fetch(`${API_BASE_URL}/prices/summary?symbol=${symbol}`);
    if (!response.ok) throw new Error('Failed to fetch price summary');
    return response.json();
  },

  async getLatestPrice(symbol = 'BTC') {
    const response = await fetch(`${API_BASE_URL}/prices/latest?symbol=${symbol}`);
    if (!response.ok) throw new Error('Failed to fetch latest price');
    return response.json();
  },

  async getPriceHistory(symbol = 'BTC', from, to, limit = 100) {
    let url = `${API_BASE_URL}/prices/history?symbol=${symbol}&limit=${limit}`;
    if (from) url += `&from=${from}`;
    if (to) url += `&to=${to}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch price history');
    return response.json();
  },

  async getPredictions(modelId, symbol = 'BTC') {
    const response = await fetch(`${API_BASE_URL}/predictions?modelId=${modelId}&symbol=${symbol}`);
    if (!response.ok) throw new Error('Failed to fetch predictions');
    return response.json();
  },

  async getModels() {
    const response = await fetch(`${API_BASE_URL}/models`);
    if (!response.ok) throw new Error('Failed to fetch models');
    return response.json();
  }
};

function MainDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for real data
  const [priceSummary, setPriceSummary] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [models, setModels] = useState([]);

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch price summary and latest price
        const summaryData = await apiService.getPriceSummary('BTC');
        setPriceSummary(summaryData.data);

        // Fetch price history for the last 30 days
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const historyData = await apiService.getPriceHistory('BTC', thirtyDaysAgo, null, 30);
        setPriceHistory(historyData.data || []);

        // Fetch models
        try {
          const modelsData = await apiService.getModels();
          setModels(modelsData.data || []);
        } catch (err) {
          console.warn('Models not available:', err.message);
        }

        // Try to fetch predictions for EMA model
        try {
          const predictionsData = await apiService.getPredictions('ema_24h', 'BTC');
          setPredictions(predictionsData.data || []);
        } catch (err) {
          console.warn('Predictions not available:', err.message);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up polling for live updates every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Format price history for chart
  const formatPriceHistoryForChart = () => {
    if (!priceHistory.length) {
      return {
        labels: ['No Data'],
        datasets: [{
          label: 'BTC Price',
          data: [0],
          fill: false,
          borderColor: '#00b3ff',
          tension: 0.4,
          pointRadius: 0,
        }]
      };
    }

    const sortedHistory = [...priceHistory].sort((a, b) => a.ts - b.ts);
    const labels = sortedHistory.map(item => 
      new Date(item.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    const data = sortedHistory.map(item => item.price);

    return {
      labels,
      datasets: [{
        label: 'BTC Price',
        data,
        fill: false,
        borderColor: '#00b3ff',
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
      }]
    };
  };

  // Format models for comparison chart
  const formatModelsForChart = () => {
    if (!models.length) {
      return {
        labels: ['No Models'],
        datasets: [{
          label: 'Accuracy %',
          data: [0],
          backgroundColor: ['rgba(200,200,210,0.7)'],
          borderWidth: 1.5,
          borderRadius: 8,
        }]
      };
    }

    return {
      labels: models.map(model => model.name || model.id),
      datasets: [{
        label: 'Model Count',
        data: models.map(() => 1), // Placeholder data
        backgroundColor: models.map((_, idx) => 
          `rgba(${38 + idx * 60}, ${38 + idx * 60}, ${38 + idx * 80}, 0.85)`
        ),
        borderWidth: 1.5,
        borderRadius: 8,
      }]
    };
  };

  // Calculate 24h change percentage for display
  const get24hChangeDisplay = () => {
    if (!priceSummary) return { value: '—', isNegative: false };
    
    const changePercent = (priceSummary.change24hPct * 100).toFixed(2);
    const isNegative = priceSummary.change24hPct < 0;
    return {
      value: `${isNegative ? '' : '+'}${changePercent}%`,
      isNegative
    };
  };

  // Get predicted price from predictions
  const getPredictedPrice = () => {
    if (!predictions.length) return '—';
    const latestPrediction = predictions[predictions.length - 1];
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(latestPrediction.predicted_price);
  };

  const change24h = get24hChangeDisplay();

  // Card tile data with real API data
  const tiles = [
    {
      title: 'CURRENT BTC PRICE',
      value: loading ? 'Loading…' : (priceSummary ? 
        new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
        }).format(priceSummary.currentPrice) : 
        'Error loading price'
      ),
      type: 'normal'
    },
    {
      title: '24 HOURS PERFORMANCE',
      value: loading ? 'Loading…' : change24h.value,
      type: change24h.isNegative ? 'negative' : 'positive'
    },
    {
      title: 'PRICE CHANGE IN 24 HRS',
      value: loading ? 'Loading…' : (priceSummary ? 
        `${priceSummary.change24hAbs >= 0 ? '+' : ''}${priceSummary.change24hAbs.toFixed(2)} USD` : 
        '—'
      ),
      type: priceSummary && priceSummary.change24hAbs < 0 ? 'negative' : 'positive'
    },
    {
      title: 'PREDICTED PRICE',
      value: loading ? 'Loading…' : getPredictedPrice(),
      type: 'accent'
    },
    {
      title: 'MODELS LOADED',
      value: loading ? 'Loading…' : models.length.toString(),
      type: 'info'
    },
  ];

  if (error) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        backgroundColor: '#1a1a1a',
        color: 'white',
        minHeight: '100vh'
      }}>
        <h2 style={{ color: '#ff6b6b' }}>Error Loading Dashboard</h2>
        <p>{error}</p>
        <p style={{ color: '#888', marginTop: '1rem' }}>
          Make sure your backend server is running at http://localhost:5000
        </p>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#00b3ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-bg" style={{ 
      backgroundColor: '#0f0f0f', 
      minHeight: '100vh', 
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <header className="main-header" style={{ 
        backgroundColor: '#1a1a1a', 
        padding: '1rem 2rem',
        borderBottom: '1px solid #333'
      }}>
        <nav className="header-nav" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#00b3ff">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>BTC Dashboard</span>
          </div>
          <ul style={{ 
            display: 'flex', 
            gap: '2rem', 
            listStyle: 'none', 
            margin: 0, 
            padding: 0 
          }}>
            <li><a href="#dashboard" style={{ color: '#00b3ff', textDecoration: 'none' }}>Dashboard</a></li>
            <li><a href="#predictions" style={{ color: '#ccc', textDecoration: 'none' }}>Predictions</a></li>
            <li><a href="#analytics" style={{ color: '#ccc', textDecoration: 'none' }}>Analytics</a></li>
            <li><a href="#market" style={{ color: '#ccc', textDecoration: 'none' }}>Market</a></li>
          </ul>
          <div>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.5rem',
                backgroundColor: '#333',
                border: '1px solid #555',
                borderRadius: '4px',
                color: 'white'
              }}
            />
          </div>
        </nav>
      </header>

      <main style={{ padding: '2rem' }}>
        {/* Status indicator */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          marginBottom: '1rem',
          fontSize: '0.9rem',
          color: '#888'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: loading ? '#ffa500' : error ? '#ff6b6b' : '#4ade80'
          }} />
          {loading ? 'Loading data...' : error ? 'Connection error' : 
           `Last updated: ${priceSummary ? new Date(priceSummary.ts).toLocaleTimeString() : '—'}`}
        </div>

        {/* Tiles Section */}
        <section style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem', 
          marginBottom: '2rem' 
        }}>
          {tiles.map((tile, idx) => (
            <div key={idx} style={{
              backgroundColor: '#1a1a1a',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #333'
            }}>
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#888', 
                marginBottom: '0.5rem',
                fontWeight: '600' 
              }}>
                {tile.title}
              </div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold',
                color: tile.type === 'negative' ? '#ff6b6b' : 
                      tile.type === 'positive' ? '#4ade80' :
                      tile.type === 'accent' ? '#00b3ff' : 'white'
              }}>
                {tile.value}
              </div>
            </div>
          ))}
        </section>

        {/* Charts Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '2fr 1fr', 
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* Main Price Chart */}
          <section style={{
            backgroundColor: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #333'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>
              BTC Price History (30 Days)
            </h2>
            <div style={{ height: '300px' }}>
              <Line 
                data={formatPriceHistoryForChart()} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: { color: '#ccc' }
                    }
                  },
                  scales: {
                    x: {
                      ticks: { color: '#888' },
                      grid: { color: '#333' }
                    },
                    y: {
                      ticks: { 
                        color: '#888',
                        callback: function(value) {
                          return '$' + value.toLocaleString();
                        }
                      },
                      grid: { color: '#333' }
                    }
                  }
                }} 
              />
            </div>
          </section>

          {/* Models Chart */}
          <section style={{
            backgroundColor: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #333'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Available Models</h3>
            <div style={{ height: '300px' }}>
              <Bar 
                data={formatModelsForChart()} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { 
                      ticks: { color: '#888' }, 
                      grid: { color: '#333' } 
                    },
                    y: { 
                      ticks: { color: '#888' }, 
                      grid: { color: '#333' } 
                    }
                  }
                }} 
              />
            </div>
          </section>
        </div>

        {/* Predictions Section */}
        {predictions.length > 0 && (
          <section style={{
            backgroundColor: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #333',
            marginBottom: '2rem'
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Latest Predictions</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1rem' 
            }}>
              {predictions.slice(-3).map((prediction, idx) => (
                <div key={idx} style={{
                  backgroundColor: '#333',
                  padding: '1rem',
                  borderRadius: '4px'
                }}>
                  <div style={{ fontSize: '0.9rem', color: '#888' }}>
                    Model: {prediction.model_id}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                    {new Intl.NumberFormat('en-US', { 
                      style: 'currency', 
                      currency: 'USD' 
                    }).format(prediction.predicted_price)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#888' }}>
                    Confidence: {(prediction.confidence * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#888' }}>
                    Horizon: {prediction.horizon}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Info Sections */}
        <section id="predictions" style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#00b3ff', marginBottom: '0.5rem' }}>Predictions</h2>
          <p style={{ color: '#ccc', lineHeight: '1.6' }}>
            Real-time model predictions fetched from your backend API. 
            The system automatically generates EMA-based predictions and displays confidence intervals.
          </p>
        </section>

        <section id="analytics" style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#00b3ff', marginBottom: '0.5rem' }}>Analytics</h2>
          <p style={{ color: '#ccc', lineHeight: '1.6' }}>
            Historical price data visualization showing trends over the last 30 days. 
            Data is sourced directly from your price tracking API with real market data.
          </p>
        </section>

        <section id="market">
          <h2 style={{ color: '#00b3ff', marginBottom: '0.5rem' }}>Market Data</h2>
          <p style={{ color: '#ccc', lineHeight: '1.6' }}>
            Live Bitcoin price data with 24-hour performance metrics. 
            Prices are updated every 30 seconds from your backend data sources.
          </p>
        </section>
      </main>
    </div>
  );
}

export default MainDashboard;