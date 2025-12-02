# Deployment Guide - Bitcoin Dashboard

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Building for Production](#building-for-production)
4. [Deployment Options](#deployment-options)
5. [Post-Deployment Checklist](#post-deployment-checklist)
6. [Monitoring & Health Checks](#monitoring--health-checks)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Memory**: Minimum 2GB RAM
- **Storage**: Minimum 1GB free space

### Required Services
- Backend API running on `http://localhost:3000` or custom URL
- (Optional) WebSocket server for real-time updates
- (Optional) Redis for caching
- (Optional) CDN for static assets

---

## Environment Variables

### Frontend `.env.production`

```bash
# API Configuration
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com

# Environment
VITE_ENV=production

# Feature Flags
VITE_FEATURE_WEBSOCKET=true
VITE_FEATURE_SW=true
VITE_FEATURE_ERROR_REPORTING=true
VITE_FEATURE_PERF_MONITORING=true

# Error Reporting (Sentry)
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_SENTRY_ENVIRONMENT=production

# Analytics (Optional)
VITE_ANALYTICS_ID=your-analytics-id

# Performance Monitoring
VITE_PERF_SAMPLE_RATE=0.1  # 10% sampling

# API Timeouts (milliseconds)
VITE_API_TIMEOUT_DEFAULT=10000
VITE_API_TIMEOUT_LARGE=30000
```

### Backend `.env`

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=your-database-url

# Redis (Optional but recommended)
REDIS_URL=redis://localhost:6379
REDIS_TTL=300  # 5 minutes

# External APIs
COINDESK_API_KEY=your-api-key
BLOCKCHAIN_INFO_API_KEY=your-api-key

# CORS
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

---

## Building for Production

### Frontend Build

```bash
cd frontend

# Install dependencies
npm ci --production=false

# Run tests (if available)
npm test

# Build for production
npm run build

# Preview production build locally
npm run preview
```

**Build Output:**
- `dist/` folder contains optimized assets
- Expected bundle size: <300KB (initial)
- All assets are hashed for cache busting

### Backend Build (if applicable)

```bash
cd backend

# Install dependencies
npm ci --production

# Run migrations (if applicable)
npm run migrate

# Start production server
npm start
```

---

## Deployment Options

### Option 1: Vercel (Recommended for Frontend)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel --prod

# Set environment variables in Vercel dashboard
```

**Vercel Configuration** (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend-api.com/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd frontend
netlify deploy --prod
```

**Netlify Configuration** (`netlify.toml`):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "https://your-backend-api.com/api/:splat"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Option 3: Docker

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=http://backend:3000
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - ./backend/data:/app/data

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### Option 4: Traditional VPS (Ubuntu/Debian)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Clone repository
git clone https://github.com/yourrepo/bitcoin-dashboard.git
cd bitcoin-dashboard

# Backend setup
cd backend
npm ci --production
pm2 start server.js --name bitcoin-backend

# Frontend setup
cd ../frontend
npm ci
npm run build

# Install nginx
sudo apt install -y nginx

# Copy nginx config (see below)
sudo cp nginx.conf /etc/nginx/sites-available/bitcoin-dashboard
sudo ln -s /etc/nginx/sites-available/bitcoin-dashboard /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Frontend
    root /path/to/frontend/dist;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    
    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket proxy
    location /ws/ {
        proxy_pass http://localhost:3000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Post-Deployment Checklist

### Immediate Verification (< 5 minutes)

- [ ] **Health Check**: Verify `https://yourdomain.com/api/health` returns `200 OK`
- [ ] **Frontend Loads**: Visit homepage and verify no console errors
- [ ] **API Connection**: Check that data loads (prices, blocks, etc.)
- [ ] **WebSocket**: Verify real-time updates work (if enabled)
- [ ] **Performance**: Run Lighthouse audit (target: 90+ score)
- [ ] **Mobile Responsive**: Test on mobile device

### Short-term Verification (< 1 hour)

- [ ] **Error Monitoring**: Check Sentry for any errors
- [ ] **API Performance**: Verify average response time <500ms
- [ ] **Cache Hit Rate**: Check cache hit rate >70%
- [ ] **Memory Usage**: Backend memory stable <512MB
- [ ] **Load Testing**: Run basic load test (100 concurrent users)

### Long-term Monitoring (24 hours)

- [ ] **Uptime**: Verify 99.9% uptime
- [ ] **Error Rate**: <0.1% error rate
- [ ] **Performance Degradation**: No significant slowdown
- [ ] **Database Growth**: Monitor database size
- [ ] **User Feedback**: Check for user-reported issues

---

## Monitoring & Health Checks

### Health Check Endpoints

```bash
# Backend health
curl https://api.yourdomain.com/api/health

# Expected response:
{
  "ok": true,
  "service": "bitcoin-dashboard-backend",
  "timestamp": 1701234567890,
  "uptime": 123456
}
```

### Performance Monitoring

**Using New Relic:**
```bash
npm install newrelic
# Add to backend/server.js:
require('newrelic');
```

**Using Datadog:**
```bash
npm install dd-trace
# Add to backend/server.js:
require('dd-trace').init();
```

### Error Monitoring with Sentry

**Frontend Setup:**
```javascript
// frontend/src/main.jsx
import * as Sentry from '@sentry/react';

if (import.meta.env.VITE_FEATURE_ERROR_REPORTING === 'true') {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_ENV,
    tracesSampleRate: 0.1,
  });
}
```

**Backend Setup:**
```javascript
// backend/server.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Add error handler
app.use(Sentry.Handlers.errorHandler());
```

### Uptime Monitoring

**Using UptimeRobot:**
- Monitor: `https://yourdomain.com/api/health`
- Interval: 5 minutes
- Alert contacts: email, SMS, Slack

**Using Pingdom:**
- Check type: HTTP
- URL: `https://yourdomain.com/api/health`
- Interval: 1 minute

---

## Rollback Procedures

### Quick Rollback (< 5 minutes)

**Vercel/Netlify:**
```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>
```

**Docker:**
```bash
# Rollback to previous image
docker-compose down
docker-compose pull bitcoin-dashboard:previous
docker-compose up -d
```

**PM2:**
```bash
# Restart with previous commit
git checkout HEAD~1
npm ci
pm2 restart bitcoin-backend
```

### Emergency Kill Switch

Create a feature flag to disable problematic features:

**Backend** (`backend/config/features.js`):
```javascript
module.exports = {
  AI_PREDICTIONS: process.env.FEATURE_AI_PREDICTIONS !== 'false',
  WEBSOCKET: process.env.FEATURE_WEBSOCKET !== 'false',
  MEMPOOL_POLLING: process.env.FEATURE_MEMPOOL_POLLING !== 'false',
};
```

**Disable features without redeployment:**
```bash
# Set environment variable and restart
export FEATURE_AI_PREDICTIONS=false
pm2 restart bitcoin-backend
```

---

## Troubleshooting

### Common Issues

**1. Build Fails**
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run build
```

**2. API Connection Errors**
- Check `VITE_API_BASE_URL` is correct
- Verify CORS is configured on backend
- Check firewall rules

**3. High Memory Usage**
```bash
# Check process memory
pm2 monit

# Restart if needed
pm2 restart bitcoin-backend

# Add memory limit
pm2 start server.js --max-memory-restart 512M
```

**4. Slow Performance**
- Enable Redis caching
- Check database query performance
- Enable CDN for static assets
- Verify bundle size <300KB

**5. WebSocket Not Connecting**
- Verify WebSocket URL uses `wss://` (not `ws://`)
- Check nginx WebSocket proxy configuration
- Verify backend WebSocket server is running

### Debug Mode

**Enable verbose logging:**
```bash
# Backend
export LOG_LEVEL=debug
pm2 restart bitcoin-backend

# Frontend (in browser console)
localStorage.setItem('DEBUG', 'true');
location.reload();
```

---

## CI/CD Pipeline Example

**GitHub Actions** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm test

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd frontend && npm ci && npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /path/to/app
            git pull
            npm ci --production
            pm2 restart bitcoin-backend
```

---

## Security Checklist

- [ ] All sensitive data in environment variables (not hardcoded)
- [ ] HTTPS enabled (SSL certificate)
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (CSP headers)
- [ ] Regular dependency updates (`npm audit`)
- [ ] Secrets not committed to git
- [ ] Database backups configured
- [ ] Firewall rules configured

---

**Last Updated**: November 30, 2025  
**Version**: 1.0  
**Maintained by**: Development Team
