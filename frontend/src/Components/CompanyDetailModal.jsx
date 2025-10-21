import React from 'react';

function CompanyDetailModal({ company, btcPrice, onClose }) {
  if (!company) return null;

  const formatNumber = (num, decimals = 2) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(decimals)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(decimals)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate additional metrics
  const avgCostBasis = company.usd_value / company.btc_holdings;
  const currentValue = company.btc_holdings * (btcPrice || 67000);
  const unrealizedPL = currentValue - company.usd_value;
  const unrealizedPLPercent = (unrealizedPL / company.usd_value) * 100;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '2rem'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          border: '1px solid #333',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '85vh',
          overflow: 'auto',
          padding: '2rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #333'
        }}>
          <div>
            <h2 style={{ 
              margin: '0 0 0.5rem 0', 
              color: '#00b3ff',
              fontSize: '1.8rem'
            }}>
              {company.company_name}
            </h2>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              color: '#888',
              fontSize: '0.9rem'
            }}>
              <span>🌍 {company.country}</span>
              <span>•</span>
              <span>Updated: {formatDate(company.last_updated)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* Holdings Overview */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#0f0f0f',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #333'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#888', 
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              fontWeight: '600'
            }}>
              Bitcoin Holdings
            </div>
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold',
              color: '#4ade80',
              marginBottom: '0.25rem'
            }}>
              {company.btc_holdings.toLocaleString()} BTC
            </div>
            <div style={{ 
              fontSize: '0.85rem', 
              color: '#888'
            }}>
              {company.percentage_of_supply?.toFixed(4)}% of total supply
            </div>
          </div>

          <div style={{
            backgroundColor: '#0f0f0f',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #333'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#888', 
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              fontWeight: '600'
            }}>
              Current Value
            </div>
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold',
              color: '#fbbf24',
              marginBottom: '0.25rem'
            }}>
              ${formatNumber(currentValue)}
            </div>
            <div style={{ 
              fontSize: '0.85rem', 
              color: '#888'
            }}>
              At ${(btcPrice || 67000).toLocaleString()}/BTC
            </div>
          </div>
        </div>

        {/* Financial Metrics */}
        <div style={{
          backgroundColor: '#0f0f0f',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333',
          marginBottom: '1.5rem'
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#888', 
            marginBottom: '1rem',
            textTransform: 'uppercase',
            fontWeight: '600'
          }}>
            Financial Analysis
          </div>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.75rem',
            fontSize: '0.9rem'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid #333'
            }}>
              <span style={{ color: '#888' }}>Average Cost Basis:</span>
              <span style={{ color: '#ccc', fontWeight: '600' }}>
                ${avgCostBasis.toLocaleString(undefined, {maximumFractionDigits: 0})} per BTC
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid #333'
            }}>
              <span style={{ color: '#888' }}>Book Value:</span>
              <span style={{ color: '#ccc', fontWeight: '600' }}>
                ${formatNumber(company.usd_value)}
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid #333'
            }}>
              <span style={{ color: '#888' }}>Unrealized P/L:</span>
              <span style={{ 
                color: unrealizedPL >= 0 ? '#4ade80' : '#ff6b6b', 
                fontWeight: '600' 
              }}>
                {unrealizedPL >= 0 ? '+' : ''}${formatNumber(Math.abs(unrealizedPL))}
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between'
            }}>
              <span style={{ color: '#888' }}>Return on Investment:</span>
              <span style={{ 
                color: unrealizedPLPercent >= 0 ? '#4ade80' : '#ff6b6b', 
                fontWeight: '600',
                fontSize: '1.1rem'
              }}>
                {unrealizedPLPercent >= 0 ? '+' : ''}{unrealizedPLPercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Supply Impact */}
        <div style={{
          backgroundColor: '#0f0f0f',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333',
          marginBottom: '1.5rem'
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#888', 
            marginBottom: '1rem',
            textTransform: 'uppercase',
            fontWeight: '600'
          }}>
            Supply Impact
          </div>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.75rem',
            fontSize: '0.9rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>Circulating Supply Held:</span>
              <span style={{ color: '#ccc', fontWeight: '600' }}>
                {company.percentage_of_supply?.toFixed(4)}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>Total Supply Held:</span>
              <span style={{ color: '#ccc', fontWeight: '600' }}>
                {((company.btc_holdings / 21000000) * 100).toFixed(4)}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>Rank by Holdings:</span>
              <span style={{ color: '#00b3ff', fontWeight: '600' }}>
                #{company.id}
              </span>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div style={{
          backgroundColor: '#0f0f0f',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #333',
          marginBottom: '1.5rem'
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#888', 
            marginBottom: '1rem',
            textTransform: 'uppercase',
            fontWeight: '600'
          }}>
            Key Information
          </div>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.5rem',
            fontSize: '0.85rem',
            color: '#ccc',
            lineHeight: '1.6'
          }}>
            <p style={{ margin: 0 }}>
              <strong style={{ color: '#00b3ff' }}>{company.company_name}</strong> holds{' '}
              <strong style={{ color: '#4ade80' }}>{company.btc_holdings.toLocaleString()} BTC</strong>,
              making it one of the largest corporate Bitcoin holders globally.
            </p>
            <p style={{ margin: 0 }}>
              At current prices, this position is worth approximately{' '}
              <strong style={{ color: '#fbbf24' }}>${formatNumber(currentValue)}</strong> USD.
            </p>
            <p style={{ margin: 0 }}>
              The company's holdings represent{' '}
              <strong>{company.percentage_of_supply?.toFixed(4)}%</strong> of Bitcoin's
              circulating supply.
            </p>
          </div>
        </div>

        {/* External Resources */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '0.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid #333'
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#888', 
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            fontWeight: '600'
          }}>
            Learn More
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(company.company_name + ' bitcoin holdings')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#00b3ff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}
            >
              Search News
            </a>
            <a
              href={`https://bitcointreasuries.net/`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#333',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}
            >
              Bitcoin Treasuries
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyDetailModal;
