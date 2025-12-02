import React, { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { SkeletonCard, SkeletonChart } from '../components/ui/Skeleton';
import CompanyDetailModal from './CompanyDetailModal';
import { colors, spacing, borderRadius, shadows } from '../styles/designSystem';
import { getChartOptions, chartColors } from '../utils/chartConfig';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function CorporateTreasuries() {
  const [treasuries, setTreasuries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [btcPrice, setBtcPrice] = useState(67000);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const formatNumber = (num) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const barChartData = {
    labels: treasuries.slice(0, 10).map(t => t.company_name),
    datasets: [{
      label: 'BTC Holdings',
      data: treasuries.slice(0, 10).map(t => t.btc_holdings),
      backgroundColor: [
        chartColors.primary + 'CC', chartColors.success + 'CC', chartColors.warning + 'CC',
        chartColors.error + 'CC', chartColors.purple + 'CC', chartColors.pink + 'CC',
        chartColors.info + 'CC', chartColors.teal + 'CC', chartColors.orange + 'CC', chartColors.gold + 'CC'
      ],
      borderRadius: 6,
      borderWidth: 0,
    }]
  };

  const doughnutData = {
    labels: treasuries.slice(0, 5).map(t => t.company_name),
    datasets: [{
      data: treasuries.slice(0, 5).map(t => t.btc_holdings),
      backgroundColor: [
        chartColors.primary + 'CC', chartColors.success + 'CC', chartColors.warning + 'CC',
        chartColors.error + 'CC', chartColors.purple + 'CC',
      ],
      borderColor: colors.bgSecondary,
      borderWidth: 3,
    }]
  };

  const barChartOptions = getChartOptions('bar', {
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${formatNumber(context.raw)} BTC`
        }
      }
    },
    scales: {
      x: { 
        ticks: { 
          color: colors.textSecondary, 
          callback: (v) => formatNumber(v) 
        }, 
        grid: { color: colors.cardBorder } 
      },
      y: { 
        ticks: { color: colors.textSecondary }, 
        grid: { display: false } 
      }
    }
  });

  const doughnutOptions = getChartOptions('doughnut', {
    plugins: {
      legend: { 
        position: 'right', 
        labels: { 
          color: colors.textPrimary, 
          padding: 15, 
          font: { size: 11 } 
        } 
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${formatNumber(context.raw)} BTC`
        }
      }
    }
  });

  if (loading && treasuries.length === 0) {
    return (
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#00b3ff', margin: '0 0 1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
          Corporate Bitcoin Treasuries
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
          <SkeletonChart height="400px" />
          <SkeletonChart height="400px" />
        </div>
      </div>
    );
  }

  if (error && treasuries.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#ff6b6b' }}>Error loading treasuries: {error}</div>;
  }

  // Pagination logic
  const totalPages = Math.ceil(treasuries.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentData = treasuries.slice(startIdx, startIdx + itemsPerPage);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ color: '#ffffffff', margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: '600' }}>
            Top Bitcoin Holders by Company
          </h3>
          <p style={{ color: '#000', margin: 0, fontSize: '0.85rem' }}>Individual company holdings and rankings</p>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#000', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            backgroundColor: loading ? '#ffa500' : '#4ade80'
          }} />
          {loading ? 'Updating...' : 'Live Data'}
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#ffffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #333' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#ccc' }}>Top 10 Bitcoin Holders</h3>
          <div style={{ height: '400px' }}><Bar data={barChartData} options={barChartOptions} /></div>
        </div>
        <div style={{ backgroundColor: '#ffffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #333' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#ccc' }}>Top 5 Distribution</h3>
          <div style={{ height: '400px' }}><Doughnut data={doughnutData} options={doughnutOptions} /></div>
        </div>
      </div>

      {/* Table with Pagination */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #333',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '50px 2fr 1fr 1fr 1fr 100px',
          gap: '1rem',
          padding: '1rem 1.5rem',
          fontWeight: 'bold',
          fontSize: '0.85rem',
          color: '#000000',
          borderBottom: '1px solid #333',
          backgroundColor: '#f5f5f5'
        }}>
          <div>#</div><div>COMPANY</div><div>BTC HOLDINGS</div><div>USD VALUE</div><div>% OF SUPPLY</div><div>COUNTRY</div>
        </div>

        {currentData.map((treasury, idx) => (
          <div key={treasury.id}
            style={{
              display: 'grid', color: '#000000',
              gridTemplateColumns: '50px 2fr 1fr 1fr 1fr 100px',
              gap: '1rem',
              padding: '1rem 1.5rem',
              borderBottom: idx < currentData.length - 1 ? '1px solid #333' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e6f7ff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            onClick={() => setSelectedCompany(treasury)}
          >
            <div>{startIdx + idx + 1}</div>
            <div style={{ fontWeight: 'bold', color: '#000000', }}>{treasury.company_name}</div>
            <div style={{ fontFamily: 'monospace', color: '#000000' }}>{formatNumber(treasury.btc_holdings)} BTC</div>
            <div style={{ fontFamily: 'monospace', color: '#000000' }}>${formatNumber(treasury.usd_value)}</div>
            <div style={{ fontFamily: 'monospace', color: '#000000' }}>{treasury.percentage_of_supply?.toFixed(4)}%</div>
            <div style={{ fontSize: '0.85rem', color: '#000000' }}>{treasury.country}</div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: '1rem'
      }}>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '6px 12px',
            backgroundColor: currentPage === 1 ? '#ccc' : '#00b3ff',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
          }}
        >
          Prev
        </button>

        <span style={{ color: '#ffffff', fontWeight: 'bold' }}>
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: '6px 12px',
            backgroundColor: currentPage === totalPages ? '#ccc' : '#00b3ff',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
          }}
        >
          Next
        </button>
      </div>

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
