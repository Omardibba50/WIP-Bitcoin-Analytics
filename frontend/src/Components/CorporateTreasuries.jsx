import React, { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { SkeletonCard, SkeletonChart } from './LoadingSpinner';
import CompanyDetailModal from './CompanyDetailModal';

const API_BASE_URL = 'http://localhost:5000/api';

function CorporateTreasuries() {
  const [treasuries, setTreasuries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [btcPrice, setBtcPrice] = useState(67000);

  useEffect(() => {
    const fetchTreasuries = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/treasuries`);
        if (!response.ok) throw new Error('Failed to fetch treasuries');
        const data = await response.json();
        setTreasuries(data.data || []);
        
        // Fetch stats
        const statsResponse = await fetch(`${API_BASE_URL}/treasuries/stats`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.data);
        }
        
        // Fetch current BTC price
        try {
          const priceResponse = await fetch(`${API_BASE_URL}/prices/latest?symbol=BTC`);
          if (priceResponse.ok) {
            const priceData = await priceResponse.json();
            setBtcPrice(priceData.data?.price || 67000);
          }
        } catch (priceErr) {
          console.warn('Failed to fetch BTC price:', priceErr);
        }
        
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTreasuries();
    const interval = setInterval(fetchTreasuries, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Format large numbers
  const formatNumber = (num) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  // Prepare horizontal bar chart data
  const barChartData = {
    labels: treasuries.slice(0, 10).map(t => t.company_name),
    datasets: [{
      label: 'BTC Holdings',
      data: treasuries.slice(0, 10).map(t => t.btc_holdings),
      backgroundColor: treasuries.slice(0, 10).map((_, idx) => {
        const colors = [
          'rgba(0, 179, 255, 0.8)',
          'rgba(74, 222, 128, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(14, 165, 233, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ];
        return colors[idx % colors.length];
      }),
      borderRadius: 6,
      borderWidth: 0,
    }]
  };

  // Prepare doughnut chart for top 5
  const doughnutData = {
    labels: treasuries.slice(0, 5).map(t => t.company_name),
    datasets: [{
      data: treasuries.slice(0, 5).map(t => t.btc_holdings),
      backgroundColor: [
        'rgba(0, 179, 255, 0.8)',
        'rgba(74, 222, 128, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(168, 85, 247, 0.8)',
      ],
      borderColor: '#1a1a1a',
      borderWidth: 3,
    }]
  };

  const barChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${formatNumber(context.raw)} BTC`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { 
          color: '#888',
          callback: (value) => formatNumber(value)
        },
        grid: { color: '#333' }
      },
      y: {
        ticks: { color: '#888' },
        grid: { display: false }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { 
          color: '#ccc',
          padding: 15,
          font: { size: 11 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = formatNumber(context.raw);
            return `${label}: ${value} BTC`;
          }
        }
      }
    }
  };

  if (loading && treasuries.length === 0) {
    return (
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ 
          color: '#00b3ff', 
          margin: '0 0 1rem 0',
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          Corporate Bitcoin Treasuries
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '2fr 1fr', 
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <SkeletonChart height="400px" />
          <SkeletonChart height="400px" />
        </div>
      </div>
    );
  }

  if (error && treasuries.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#ff6b6b' }}>
        Error loading treasuries: {error}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Header with Live Status */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h3 style={{ 
            color: '#ccc', 
            margin: '0 0 0.5rem 0',
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>
            Top Bitcoin Holders by Company
          </h3>
          <p style={{ 
            color: '#888', 
            margin: 0,
            fontSize: '0.85rem'
          }}>
            Individual company holdings and rankings
          </p>
        </div>
        <div style={{ 
          fontSize: '0.85rem', 
          color: '#888',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: loading ? '#ffa500' : '#4ade80'
          }} />
          {loading ? 'Updating...' : 'Live Data'}
        </div>
      </div>

      {/* Charts Grid - Visualizations Only */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr', 
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Horizontal Bar Chart */}
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1rem',
            color: '#ccc'
          }}>
            Top 10 Bitcoin Holders
          </h3>
          <div style={{ height: '400px' }}>
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        {/* Doughnut Chart */}
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1rem',
            color: '#ccc'
          }}>
            Top 5 Distribution
          </h3>
          <div style={{ height: '400px' }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #333',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '50px 2fr 1fr 1fr 1fr 100px',
          gap: '1rem',
          padding: '1rem 1.5rem',
          backgroundColor: '#252525',
          fontWeight: 'bold',
          fontSize: '0.85rem',
          color: '#888',
          borderBottom: '1px solid #333'
        }}>
          <div>#</div>
          <div>COMPANY</div>
          <div>BTC HOLDINGS</div>
          <div>USD VALUE</div>
          <div>% OF SUPPLY</div>
          <div>COUNTRY</div>
        </div>

        {treasuries.map((treasury, idx) => (
          <div
            key={treasury.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '50px 2fr 1fr 1fr 1fr 100px',
              gap: '1rem',
              padding: '1rem 1.5rem',
              borderBottom: idx < treasuries.length - 1 ? '1px solid #333' : 'none',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#252525';
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
            onClick={() => setSelectedCompany(treasury)}
          >
            <div style={{ 
              color: '#888',
              fontWeight: 'bold'
            }}>
              {idx + 1}
            </div>
            <div style={{ 
              color: '#00b3ff', 
              fontWeight: 'bold'
            }}>
              {treasury.company_name}
            </div>
            <div style={{ 
              color: '#4ade80',
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}>
              {formatNumber(treasury.btc_holdings)} BTC
            </div>
            <div style={{ 
              color: '#fbbf24',
              fontFamily: 'monospace'
            }}>
              ${formatNumber(treasury.usd_value)}
            </div>
            <div style={{ 
              color: '#a855f7',
              fontFamily: 'monospace'
            }}>
              {treasury.percentage_of_supply?.toFixed(4)}%
            </div>
            <div style={{ 
              color: '#888',
              fontSize: '0.85rem'
            }}>
              {treasury.country}
            </div>
          </div>
        ))}
      </div>

      {/* Company Detail Modal */}
      {selectedCompany && (
        <CompanyDetailModal 
          company={selectedCompany}
          btcPrice={btcPrice}
          onClose={() => setSelectedCompany(null)} 
        />
      )}
    </div>
  );
}

export default CorporateTreasuries;
