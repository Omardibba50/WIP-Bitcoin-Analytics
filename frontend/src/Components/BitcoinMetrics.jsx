import React, { useState, useEffect } from 'react';
import { SkeletonCard } from './LoadingSpinner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function BitcoinMetrics() {
  // Keep metrics flexible: could be object (original) or array (paginated list)
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state (used only if metrics is an array)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/metrics/all`);
        if (!response.ok) throw new Error('Failed to fetch metrics');
        const data = await response.json();
        // Accept either array or object - store raw payload
        setMetrics(data.data ?? data); // prefer data.data if present
        setError(null);
      } catch (err) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 300000); // 5 min
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num, decimals = 2) => {
    if (typeof num !== 'number') return num ?? '-';
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(decimals)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(decimals)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };

  // ---------- Loading / Error ----------
  if (loading && !metrics) {
    return (
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#ff6b6b' }}>
        Error loading metrics: {error}
      </div>
    );
  }

  if (!metrics) return null;

  // ---------- If metrics is an array -> enable pagination + render generic metric cards ----------
  if (Array.isArray(metrics)) {
    const totalPages = Math.max(1, Math.ceil(metrics.length / itemsPerPage));
    const startIdx = (currentPage - 1) * itemsPerPage;
    const currentItems = metrics.slice(startIdx, startIdx + itemsPerPage);

    return (
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          {currentItems.map((m, i) => (
            <div key={m.id ?? `${startIdx + i}`} style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #fff'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#000',
                marginBottom: '0.5rem',
                fontWeight: '700',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                borderLeft: '3px solid #000000ff',
                paddingLeft: '0.5rem'
              }}>
                {m.title ?? m.name ?? 'Metric'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#000', marginBottom: '0.3rem' }}>
                {m.description ?? ''}
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#000' }}>
                {typeof m.value === 'number' ? formatNumber(m.value) : (m.value ?? '-')}
              </div>
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
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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

          <span style={{ color: '#000', fontWeight: 'bold' }}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
      </div>
    );
  }

  // ---------- Otherwise metrics is an object (original layout) ----------
  // Defensive destructure
  const supply = metrics.supply ?? {};
  const gold = metrics.gold ?? {};
  const treasury = metrics.treasury ?? {};

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Section Headers with Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem'
      }}>
        {/* Gold Section */}
        <div style={{
          gridColumn: 'span 3',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',color: '#000000',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #ffffff',
            position: 'relative'
          }}>
            <div style={{
              fontSize: '0.75rem',
                backgroundColor: '#ffffff',color: '#000000',
              marginBottom: '0.5rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderLeft: '3px solid #ffffff',
              paddingLeft: '0.5rem'
            }}>
              Gold Metrics
            </div>
            <div style={{ fontSize: '0.7rem', backgroundColor: '#ffffff', color: '#000000', marginBottom: '0.3rem' }}>
              Bitcoin priced in Gold
            </div>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
                backgroundColor: '#ffffff',color: '#000000',
            }}>
              {typeof gold?.btcInGold === 'number' ? gold.btcInGold.toFixed(1) : (gold?.btcInGold ?? '-')} oz
            </div>
          </div>

          <div style={{
              backgroundColor: '#ffffff',color: '#000000',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #ffffff'
          }}>
            <div style={{
              fontSize: '0.75rem',
               backgroundColor: '#ffffff',color: '#000000',
              marginBottom: '0.5rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderLeft: '3px solid #ffffff',
              paddingLeft: '0.5rem'
            }}>
              Gold Metrics
            </div>
            <div style={{ fontSize: '0.7rem',   backgroundColor: '#ffffff',color: '#000000', marginBottom: '0.3rem' }}>
              Bitcoin vs Gold Market Cap
            </div>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              backgroundColor: '#ffffff',color: '#000000'
            }}>
              {typeof gold?.btcVsGoldMarketCapPct === 'number' ? gold.btcVsGoldMarketCapPct.toFixed(2) : (gold?.btcVsGoldMarketCapPct ?? '-')}%
            </div>
          </div>

          <div style={{
              backgroundColor: '#ffffff',color: '#000000',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #fff'
          }}>
            <div style={{
              fontSize: '0.75rem',
               backgroundColor: '#ffffff',color: '#000000',
              marginBottom: '0.5rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderLeft: '3px solid #ffffff',
              paddingLeft: '0.5rem'
            }}>
              Gold Metrics
            </div>
            <div style={{ fontSize: '0.7rem',backgroundColor: '#ffffff', color: '#000000', marginBottom: '0.3rem' }}>
              Gold Price per Oz
            </div>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              backgroundColor: '#ffffff', color: '#000000'
            }}>
              ${typeof gold?.goldPricePerOz === 'number' ? gold.goldPricePerOz.toLocaleString() : (gold?.goldPricePerOz ?? '-')}
            </div>
          </div>
        </div>

        {/* Corporate Treasuries Section */}
        <div style={{
          gridColumn: 'span 3',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #fff'
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: '#000000',
              marginBottom: '0.5rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderLeft: '3px solid #fff',
              paddingLeft: '0.5rem'
            }}>
              Corporate Treasuries
            </div>
            <div style={{ fontSize: '0.7rem', color: '#000', marginBottom: '0.3rem' }}>
              Held in Corp. Treasuries
            </div>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              color: '#000000'
            }}>
              {treasury?.totalBtcHeld?.toLocaleString?.() ?? (treasury?.totalBtcHeld ?? '-')} BTC
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #fff'
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: '#000000',
              marginBottom: '0.5rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderLeft: '3px solid #000000',
              paddingLeft: '0.5rem'
            }}>
              Corporate Treasuries
            </div>
            <div style={{ fontSize: '0.7rem', color: '#000000', marginBottom: '0.3rem' }}>
              Value in Corp. Treasuries
            </div>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              color: '#000000'
            }}>
              ${formatNumber(treasury?.valueUSD ?? 0)}
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #fff'
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: '#000000',
              marginBottom: '0.5rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderLeft: '3px solid #fff',
              paddingLeft: '0.5rem'
            }}>
              Corporate Treasuries
            </div>
            <div style={{ fontSize: '0.7rem', color: '#000000', marginBottom: '0.3rem' }}>
              Supply Pct. in Corp. Treasuries
            </div>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              color: '#000000'
            }}>
              {typeof treasury?.supplyPct === 'number' ? treasury.supplyPct.toFixed(2) : (treasury?.supplyPct ?? '-')}%
            </div>
          </div>
        </div>

        {/* Supply Section */}
        <div style={{
          gridColumn: 'span 4',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #fff'
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: '#000000ff',
              marginBottom: '0.5rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderLeft: '3px solid #4ade80',
              paddingLeft: '0.5rem'
            }}>
              Supply Metrics
            </div>
            <div style={{ fontSize: '0.7rem', color: '#000000', marginBottom: '0.3rem' }}>
              Money Supply
            </div>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              color: '#000000ff'
            }}>
              {typeof supply?.moneySupply === 'number'
                ? supply.moneySupply.toLocaleString(undefined, { maximumFractionDigits: 2 })
                : (supply?.moneySupply ?? '-')} BTC
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #fff'
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: '#000000',
              marginBottom: '0.5rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderLeft: '3px solid #fff',
              paddingLeft: '0.5rem'
            }}>
              Supply Metrics
            </div>
            <div style={{ fontSize: '0.7rem', color: '#000000', marginBottom: '0.3rem' }}>
              Percentage Issued
            </div>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              color: '#000000'
            }}>
              {typeof supply?.percentageIssued === 'number' ? supply.percentageIssued.toFixed(2) : (supply?.percentageIssued ?? '-')}%
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #ffffff'
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: '#000000',
              marginBottom: '0.5rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderLeft: '3px solid #4ade80',
              paddingLeft: '0.5rem'
            }}>
              Supply Metrics
            </div>
            <div style={{ fontSize: '0.7rem', color: '#000000', marginBottom: '0.3rem' }}>
              Unspendable
            </div>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              color: '#000000'
            }}>
              {typeof supply?.unspendable === 'number' ? supply.unspendable.toFixed(2) : (supply?.unspendable ?? '-')} BTC
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #ffffff'
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: '#000000',
              marginBottom: '0.5rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderLeft: '3px solid #000000ff',
              paddingLeft: '0.5rem'
            }}>
              Supply Metrics
            </div>
            <div style={{ fontSize: '0.7rem', color: '#000000', marginBottom: '0.3rem' }}>
              Issuance Remaining
            </div>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              color: '#000000'
            }}>
              {typeof supply?.issuanceRemaining === 'number'
                ? supply.issuanceRemaining.toLocaleString(undefined, { maximumFractionDigits: 2 })
                : (supply?.issuanceRemaining ?? '-')} BTC
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BitcoinMetrics;
