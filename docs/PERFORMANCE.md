# Performance Optimization Guide

## Overview
This document outlines the performance optimizations implemented in the Bitcoin Dashboard and provides guidelines for maintaining optimal performance.

## Current Performance Benchmarks

### Target Metrics (Production)
- **TTFB (Time to First Byte)**: < 200ms
- **FCP (First Contentful Paint)**: < 1.0s
- **LCP (Largest Contentful Paint)**: < 2.5s
- **TTI (Time to Interactive)**: < 3.5s
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FID (First Input Delay)**: < 100ms

### Bundle Size Targets
- **Main Bundle**: < 200KB (gzipped)
- **React Vendor**: < 150KB (gzipped)
- **Chart Vendor**: < 100KB (gzipped)
- **Total Initial Load**: < 500KB (gzipped)

## Optimization Techniques Implemented

### 1. Code Splitting

#### Manual Chunks (vite.config.js)
```javascript
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'chart-vendor': ['chart.js', 'react-chartjs-2'],
  'date-vendor': ['date-fns'],
  'utils': [
    './src/services/apiClient.js',
    './src/services/dataOrchestrator.js',
    './src/utils/chartFactory.js',
  ],
}
```

**Benefits:**
- Vendors cached separately from app code
- Better cache hit rate on deployments
- Parallel chunk downloads

#### Route-Based Code Splitting
Implement lazy loading for route components:

```javascript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./Components/MainDashboard'));
const AIModels = lazy(() => import('./Components/AIModelMetrics'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ai-models" element={<AIModels />} />
      </Routes>
    </Suspense>
  );
}
```

### 2. Build Optimization

#### Terser Minification
```javascript
terserOptions: {
  compress: {
    drop_console: true,      // Remove console.log
    drop_debugger: true,      // Remove debugger statements
    pure_funcs: ['console.log', 'console.info', 'console.debug'],
  },
}
```

#### CSS Code Splitting
- Enabled: `cssCodeSplit: true`
- Each component's CSS module loads independently
- Reduces main CSS bundle size

### 3. API & Data Optimization

#### Request Deduplication (apiClient.js)
```javascript
// Automatic deduplication prevents duplicate simultaneous requests
const data1 = await apiClient.get('/api/prices');
const data2 = await apiClient.get('/api/prices'); // Uses cached promise
```

#### Smart Polling (useDataFetch hook)
```javascript
// Pauses polling when tab is hidden
useDataFetch('/api/blocks', {
  pollInterval: 30000,
  enabled: true,
});
// Automatically pauses when document.hidden === true
```

#### Progressive Loading (useDashboardData hook)
```javascript
// Tier 1: Critical data (price, blocks) - loads first
// Tier 2: Important data (hashrate, difficulty) - loads after tier 1
// Tier 3: Nice-to-have data (treasuries, predictions) - loads last
```

### 4. Rendering Optimization

#### Chart Pooling (chartFactory.js)
- Chart instances reused instead of destroyed/recreated
- Reduces memory allocations
- Faster chart updates

#### Skeleton Screens
- Immediate visual feedback during loading
- Reduces perceived load time
- Prevents layout shift (CLS optimization)

#### CSS Modules
- Scoped styles reduce cascade calculations
- Tree-shaking removes unused styles
- Smaller CSS bundles

### 5. Caching Strategy

#### Service Worker (PWA)
```javascript
// API responses cached for 2-5 minutes
runtimeCaching: [
  {
    urlPattern: /^\/api\/.*/i,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'app-api-cache',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 2 * 60,
      },
    },
  },
]
```

#### In-Memory Cache (apiClient.js)
- GET requests cached for 30 seconds by default
- Configurable per endpoint
- Automatic cache invalidation

## Performance Monitoring

### Web Vitals Tracking (WebVitalsMonitor.jsx)
```javascript
import { WebVitalsMonitor } from './Components/WebVitalsMonitor';

function App() {
  return (
    <>
      {import.meta.env.DEV && <WebVitalsMonitor />}
      {/* ... rest of app */}
    </>
  );
}
```

**Metrics Tracked:**
- FCP, LCP, FID, CLS, TTFB
- API request timings
- Chart render times
- WebSocket connection health

### Chrome DevTools Performance Panel
1. Open DevTools → Performance tab
2. Click Record
3. Interact with dashboard
4. Stop recording
5. Analyze:
   - Long tasks (> 50ms)
   - Scripting time
   - Rendering/painting time
   - Memory usage

### Lighthouse CI
```bash
npm install -g @lhci/cli

# Run audit
lhci autorun --collect.url=http://localhost:5173

# Generate report
lhci upload --target=temporary-public-storage
```

**Target Scores:**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90

## Profiling Guide

### React DevTools Profiler
1. Install React DevTools browser extension
2. Open Profiler tab
3. Click Record
4. Interact with dashboard
5. Stop recording
6. Analyze component render times

**Key Metrics:**
- Component render duration
- Number of renders
- Why component re-rendered

### Bundle Analysis
```bash
# Install analyzer
npm install -D rollup-plugin-visualizer

# Add to vite.config.js plugins:
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  react(),
  visualizer({
    open: true,
    gzipSize: true,
    brotliSize: true,
  }),
]

# Build and view
npm run build
# Opens bundle visualization in browser
```

### Network Profiling
1. Open DevTools → Network tab
2. Enable "Disable cache"
3. Reload page
4. Analyze:
   - Total transfer size
   - Number of requests
   - Waterfall timings
   - Resource priorities

## Optimization Checklist

### Before Deployment
- [ ] Run `npm run build` and check bundle sizes
- [ ] Run Lighthouse audit (all scores > 90)
- [ ] Test on slow 3G connection
- [ ] Test on mobile devices
- [ ] Check bundle visualization for unexpected large dependencies
- [ ] Verify code splitting working correctly
- [ ] Test service worker caching
- [ ] Verify no console.logs in production build

### Regular Maintenance
- [ ] Monitor bundle size over time (set alerts if > 600KB total)
- [ ] Review and update dependencies quarterly
- [ ] Profile new features before merging
- [ ] Review Web Vitals data monthly
- [ ] Test performance on low-end devices

## Common Performance Issues

### Issue: Large Initial Bundle
**Symptoms:** Slow initial load, large main.js file  
**Solutions:**
- Add more route-based code splitting
- Check for unintentionally imported large libraries
- Review bundle visualization
- Use dynamic imports for heavy components

### Issue: Slow Chart Rendering
**Symptoms:** Lag when charts update, high CPU usage  
**Solutions:**
- Reduce data points (aggregate older data)
- Use `chartFactory` with dataset reuse
- Throttle updates (max 1 per second)
- Consider canvas-based charts for large datasets

### Issue: Memory Leaks
**Symptoms:** Page slows down over time, high memory usage  
**Solutions:**
- Ensure all intervals/timeouts cleared in cleanup
- Check WebSocket connections properly closed
- Verify chart instances destroyed
- Use Chrome DevTools Memory profiler

### Issue: Excessive Re-renders
**Symptoms:** UI feels sluggish, high React render count  
**Solutions:**
- Use React.memo for expensive components
- Memoize callbacks with useCallback
- Memoize computed values with useMemo
- Review dependency arrays in useEffect

### Issue: API Request Storms
**Symptoms:** Many simultaneous API requests, backend overload  
**Solutions:**
- Verify request deduplication working
- Use progressive loading (tier system)
- Increase cache TTL where appropriate
- Implement request batching for related data

## Advanced Optimizations

### Service Worker Pre-caching
```javascript
// Pre-cache critical assets on install
workbox.precaching.precacheAndRoute([
  { url: '/assets/main.js', revision: 'v1' },
  { url: '/assets/main.css', revision: 'v1' },
]);
```

### Resource Hints
```html
<!-- Preconnect to API domain -->
<link rel="preconnect" href="https://api.blockchain.info">

<!-- Prefetch next likely route -->
<link rel="prefetch" href="/ai-models">
```

### Image Optimization
```javascript
// Use modern formats with fallbacks
<picture>
  <source srcset="chart.webp" type="image/webp">
  <img src="chart.png" alt="Chart">
</picture>
```

### Web Workers for Heavy Computation
```javascript
// Offload data processing to worker
const worker = new Worker('/workers/dataProcessor.js');
worker.postMessage({ data: largeDataset });
worker.onmessage = (e) => {
  setProcessedData(e.data);
};
```

## Performance Budget

### JavaScript Budget
- **Main Bundle**: 200KB (gzipped)
- **React Vendor**: 150KB (gzipped)
- **Chart Vendor**: 100KB (gzipped)
- **Other Vendors**: 50KB (gzipped)
- **Total**: 500KB (gzipped)

### Network Budget (Initial Load)
- **Total Requests**: < 30
- **Critical Path Requests**: < 10
- **API Calls**: < 5

### Runtime Budget
- **Main Thread Idle Time**: > 50%
- **Long Tasks**: < 5 per minute
- **Memory Usage**: < 100MB
- **FPS**: > 55 (target 60)

## Monitoring Setup

### Production Monitoring
1. **Real User Monitoring (RUM)**
   - Integrate with service like Sentry, DataDog, or New Relic
   - Track Web Vitals from real users
   - Set up alerts for performance regressions

2. **Synthetic Monitoring**
   - Schedule Lighthouse CI runs hourly
   - Monitor from multiple geographic locations
   - Track performance over time

3. **Error Tracking**
   - Log performance-related errors
   - Track slow API responses
   - Monitor chart rendering failures

### Alerting Thresholds
- **LCP > 3.0s**: Warning
- **LCP > 4.0s**: Critical
- **Bundle size increase > 10%**: Warning
- **API response time > 2s**: Warning
- **Error rate > 1%**: Critical

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Vite Performance Guide](https://vitejs.dev/guide/performance.html)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

## Conclusion

Performance is an ongoing process, not a one-time task. Regular monitoring, profiling, and optimization ensure the dashboard remains fast and responsive as it evolves. Use this guide as a reference for maintaining optimal performance.

---

**Last Updated**: 2024  
**Maintained By**: Development Team
