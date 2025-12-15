/**
 * DevTools Component - Development-only performance dashboard
 */

import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '../utils/performance';
import { colors, spacing, borderRadius, shadows } from '../styles/designSystem';
import { FEATURES } from '../constants/config';

const DevTools = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('webvitals');
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // Only show in development
    if (!FEATURES.DEV_TOOLS_ENABLED) return;

    // Subscribe to performance updates
    const unsubscribe = performanceMonitor.subscribe(({ summary }) => {
      setMetrics(summary);
    });

    // Initial load
    setMetrics(performanceMonitor.getSummary());

    return unsubscribe;
  }, []);

  if (!FEATURES.DEV_TOOLS_ENABLED || !metrics) return null;

  const tabs = [
    { id: 'webvitals', label: 'Web Vitals', icon: null },
    { id: 'api', label: 'API Calls', icon: null },
    { id: 'renders', label: 'Renders', icon: null },
    { id: 'custom', label: 'Custom', icon: null },
  ];

  const buttonStyle = {
    position: 'fixed',
    bottom: spacing.md,
    right: spacing.md,
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: colors.accentGradient,
    border: 'none',
    color: 'white',
    fontSize: '1.5rem',
    cursor: 'pointer',
    boxShadow: shadows.lg,
    zIndex: 9998,
    transition: 'transform 0.2s',
  };

  const panelStyle = {
    position: 'fixed',
    bottom: spacing.md,
    right: spacing.md,
    width: '600px',
    maxHeight: '70vh',
    background: colors.cardBg,
    backdropFilter: 'blur(10px)',
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.cardBorder}`,
    boxShadow: shadows.lg,
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const renderWebVitals = () => (
    <div style={{ padding: spacing.md }}>
      <h3 style={{ margin: `0 0 ${spacing.md}`, color: colors.textPrimary }}>
        Core Web Vitals
      </h3>
      {Object.entries(metrics.webVitals).map(([name, metric]) => (
        <div
          key={name}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: spacing.sm,
            marginBottom: spacing.xs,
            background: colors.bgSecondary,
            borderRadius: borderRadius.sm,
            borderLeft: `3px solid ${metric.status === 'good' ? colors.success : colors.error}`,
          }}
        >
          <span style={{ color: colors.textPrimary, fontWeight: '600' }}>{name}</span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: colors.textPrimary }}>
              {Math.round(metric.value)} {name === 'CLS' ? '' : 'ms'}
            </div>
            {metric.threshold && (
              <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>
                Threshold: {metric.threshold} {name === 'CLS' ? '' : 'ms'}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderApiMetrics = () => (
    <div style={{ padding: spacing.md }}>
      <h3 style={{ margin: `0 0 ${spacing.md}`, color: colors.textPrimary }}>
        API Performance
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm, marginBottom: spacing.md }}>
        <MetricCard label="Total Requests" value={metrics.api.totalRequests} />
        <MetricCard label="Success Rate" value={`${Math.round(metrics.api.successRate)}%`} />
        <MetricCard label="Avg Duration" value={`${metrics.api.avgDuration}ms`} />
        <MetricCard label="Failed" value={metrics.api.failedRequests} />
      </div>
      {metrics.api.slowestRequest && (
        <div style={{
          padding: spacing.sm,
          background: colors.bgSecondary,
          borderRadius: borderRadius.sm,
          marginTop: spacing.md,
        }}>
          <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginBottom: spacing.xs }}>
            Slowest Request:
          </div>
          <div style={{ color: colors.textPrimary, fontSize: '0.85rem' }}>
            {metrics.api.slowestRequest.method} {metrics.api.slowestRequest.endpoint}
          </div>
          <div style={{ color: colors.warning, fontSize: '0.85rem', marginTop: spacing.xs }}>
            {Math.round(metrics.api.slowestRequest.duration)}ms
          </div>
        </div>
      )}
    </div>
  );

  const renderRenderMetrics = () => (
    <div style={{ padding: spacing.md }}>
      <h3 style={{ margin: `0 0 ${spacing.md}`, color: colors.textPrimary }}>
        Component Renders
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing.sm, marginBottom: spacing.md }}>
        <MetricCard label="Total" value={metrics.renders.total} />
        <MetricCard label="Slow (>16ms)" value={metrics.renders.slowRenders} />
        <MetricCard label="Avg Duration" value={`${metrics.renders.avgDuration}ms`} />
      </div>
      <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginTop: spacing.md }}>
        🎯 Target: &lt;16ms per render (60fps)
      </div>
    </div>
  );

  const renderCustomMetrics = () => (
    <div style={{ padding: spacing.md }}>
      <h3 style={{ margin: `0 0 ${spacing.md}`, color: colors.textPrimary }}>
        Custom Metrics
      </h3>
      {Object.keys(metrics.custom).length === 0 ? (
        <div style={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
          No custom metrics recorded
        </div>
      ) : (
        Object.entries(metrics.custom).map(([name, values]) => (
          <div
            key={name}
            style={{
              padding: spacing.sm,
              marginBottom: spacing.xs,
              background: colors.bgSecondary,
              borderRadius: borderRadius.sm,
            }}
          >
            <div style={{ color: colors.textPrimary, fontWeight: '600' }}>{name}</div>
            <div style={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
              {Array.isArray(values) ? `${values.length} entries` : JSON.stringify(values)}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <>
      <button
        style={buttonStyle}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        title="Performance DevTools"
      >
        Dev
      </button>

      {isOpen && (
        <div style={panelStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: spacing.md,
              borderBottom: `1px solid ${colors.cardBorder}`,
              background: colors.bgSecondary,
            }}
          >
            <h2 style={{ margin: 0, color: colors.textPrimary, fontSize: '1.25rem' }}>
              Performance DevTools
            </h2>
            <button
              onClick={() => {
                performanceMonitor.clear();
                setMetrics(performanceMonitor.getSummary());
              }}
              style={{
                padding: `${spacing.xs} ${spacing.sm}`,
                background: colors.bgTertiary,
                border: 'none',
                borderRadius: borderRadius.sm,
                color: colors.textPrimary,
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              Clear
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              borderBottom: `1px solid ${colors.cardBorder}`,
              background: colors.bgSecondary,
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: spacing.sm,
                  background: activeTab === tab.id ? colors.bgTertiary : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? `2px solid ${colors.primary}` : 'none',
                  color: activeTab === tab.id ? colors.textPrimary : colors.textSecondary,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: 'auto' }}>
            {activeTab === 'webvitals' && renderWebVitals()}
            {activeTab === 'api' && renderApiMetrics()}
            {activeTab === 'renders' && renderRenderMetrics()}
            {activeTab === 'custom' && renderCustomMetrics()}
          </div>
        </div>
      )}
    </>
  );
};

const MetricCard = ({ label, value }) => (
  <div
    style={{
      padding: spacing.sm,
      background: colors.bgSecondary,
      borderRadius: borderRadius.sm,
      textAlign: 'center',
    }}
  >
    <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginBottom: spacing.xs }}>
      {label}
    </div>
    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: colors.textPrimary }}>
      {value}
    </div>
  </div>
);

export default DevTools;
