import React, { useEffect, useState } from 'react';
import { aiApi } from '../services/api';

function AIPredictionCard() {
  const [prediction, setPrediction] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeToNext, setTimeToNext] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [predData, statusData] = await Promise.all([
        aiApi.getLatestPrediction(),
        aiApi.getStatus()
      ]);
      setPrediction(predData);
      setStatus(statusData);
      setError(null);
    } catch (err) {
      console.error('Error fetching AI prediction:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Calculate time to next prediction
  useEffect(() => {
    if (!status?.polling?.next_prediction) return;
    
    const updateTimer = () => {
      const nextTime = new Date(status.polling.next_prediction).getTime();
      const now = Date.now();
      const diff = nextTime - now;
      
      if (diff <= 0) {
        setTimeToNext('Generating...');
        return;
      }
      
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeToNext(`${minutes}m ${seconds}s`);
    };
    
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [status]);

  if (loading) {
    return (
      <div style={{
        background: 'rgba(26, 26, 26, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 179, 255, 0.2)',
        borderRadius: '12px',
        padding: '1.5rem',
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#00b3ff' }}>Loading AI prediction...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: 'rgba(26, 26, 26, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 77, 77, 0.3)',
        borderRadius: '12px',
        padding: '1.5rem',
        height: '200px'
      }}>
        <div style={{ color: '#ff4d4d', fontSize: '0.9rem' }}>
          Error: {error}
        </div>
        <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.5rem' }}>
          AI service may be initializing. Please wait...
        </div>
      </div>
    );
  }

  const isOperational = status?.status === 'operational';
  const changePercent = prediction?.predicted_change_percent || 0;
  const confidence = (prediction?.confidence || 0) * 100;
  const isPositive = changePercent > 0;

  // Simplified confidence color - corporate blue only
  const getConfidenceColor = () => {
    return '#00b3ff';
  };

  return (
    <div style={{
      background: 'rgba(26, 26, 26, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(0, 179, 255, 0.2)',
      borderRadius: '12px',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#fff',
            margin: 0
          }}>
            AI Price Prediction
          </h3>
        </div>
        <div style={{
          background: 'rgba(0, 179, 255, 0.1)',
          color: '#00b3ff',
          padding: '0.25rem 0.75rem',
          borderRadius: '20px',
          fontSize: '0.7rem',
          fontWeight: '600',
          border: '1px solid rgba(0, 179, 255, 0.3)'
        }}>
          {isOperational ? '● LIVE' : '○ INITIALIZING'}
        </div>
      </div>

      {/* Prediction Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Current Price */}
        <div>
          <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
            Current Price
          </div>
          <div style={{ color: '#fff', fontSize: '1.25rem', fontWeight: '600' }}>
            ${prediction?.current_price?.toLocaleString() || '---'}
          </div>
        </div>

        {/* Predicted Price */}
        <div>
          <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
            Predicted (1h)
          </div>
          <div style={{
            color: '#00b3ff',
            fontSize: '1.25rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            ${prediction?.predicted_price?.toLocaleString() || '---'}
            <span style={{
              color: isPositive ? '#00b3ff' : '#a0a0a0',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              {isPositive ? '↑' : '↓'} {Math.abs(changePercent).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Confidence Bar */}
      <div style={{ marginTop: '1rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem'
        }}>
          <span style={{ color: '#888', fontSize: '0.75rem' }}>
            Confidence Score
          </span>
          <span style={{
            color: '#00b3ff',
            fontSize: '0.85rem',
            fontWeight: '600'
          }}>
            {confidence.toFixed(1)}%
          </span>
        </div>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          height: '8px',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            background: '#00b3ff',
            height: '100%',
            width: `${confidence}%`,
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Footer Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{ color: '#666', fontSize: '0.7rem' }}>
          Model: LSTM v1.0
        </div>
        <div style={{
          color: '#00b3ff',
          fontSize: '0.7rem',
          fontWeight: '600'
        }}>
          Next: {timeToNext}
        </div>
      </div>
    </div>
  );
}

export default AIPredictionCard;
