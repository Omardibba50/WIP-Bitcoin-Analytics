# Bitcoin Analytics Dashboard

A comprehensive full-stack application for Bitcoin price tracking, network analysis, and predictive modeling. Built as a Work Integrated Project for Blockchain Development Program.

## 🚀 Quick Start

Get the entire system running in under 5 minutes:

```bash
# 1. Clone and navigate to project
git clone https://github.com/MamidiPavanReddy/WIP.git
cd WIP

# 2. Start Backend (Terminal 1)
cd backend
npm install
node scripts/migrate.js
npm start

# 3. Start Frontend (OPEN NEW TERMINAL - keep backend running)
# Option A: Navigate from backend directory
cd ../frontend
# Option B: Navigate from project root directory  
cd frontend
npm install
npm run dev
```

**Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

**What you should see:**
- After 5-10 minutes: Interactive price charts, real-time Bitcoin price cards, and recent blockchain blocks
- After 30+ minutes: Network metrics (hashrate/difficulty charts), correlation analysis, and corporate treasury data
- All charts should update automatically with live data

⚠️ **Important:** Charts will populate with data after 5-10 minutes as background services collect initial blockchain data. See "Background Services" section below for details on data collection timeline.

## 🔑 Partner Onboarding Checklist

Before you start, ensure you can check these items:
- [ ] Node.js 20+ installed (`node --version` shows v20.x.x)
- [ ] Build tools installed (for better-sqlite3 compilation)
- [ ] Git installed and repository cloned
- [ ] Backend dependencies installed (`npm install` completed)
- [ ] Frontend dependencies installed (`npm install` completed) 
- [ ] Database initialized (`node scripts/migrate.js` ran)
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 5173
- [ ] Data collection started (check backend logs)

## 🔐 API Configuration

The dashboard uses several external APIs. Most features work without API keys, but some require them for full functionality:

| API Key | Status | Purpose | How to Get |
|---------|--------|---------|------------|
| **COINGECKO_API_KEY** | Optional | Increases rate limits from 10 to 100 requests/minute | [CoinGecko API](https://www.coingecko.com/en/api) - Free tier available |
| **COINDESK_API_KEY** | Required for backfill scripts only | Historical OHLCV candlestick data | [CoinDesk API](https://www.coindesk.com/apis/) - Required for price history |
| **SCRAPER_API_KEY** | Optional (has fallback) | Corporate treasury data scraping | [ScraperAPI](https://www.scraperapi.com/) - Free tier available |
| **GOLD_API_KEY** | Optional | Gold price comparison data | [GoldAPI.io](https://www.goldapi.io/) - Free tier available |
| **METALS_API_KEY** | Optional | Alternative gold price source | [Metals-API.com](https://metals-api.com/) - Free tier available |

### Quick API Setup

**For basic operation (no API keys needed):**
```bash
# The dashboard works with public APIs and built-in fallbacks
# Just follow the Quick Start section above
```

**For enhanced functionality:**
```bash
# 1. Copy the updated environment file
cd backend
cp .env.example .env

# 2. Add your API keys to .env (uncomment and fill in)
# COINGECKO_API_KEY=your_key_here
# COINDESK_API_KEY=your_key_here
# SCRAPER_API_KEY=your_key_here
# GOLD_API_KEY=your_key_here
# METALS_API_KEY=your_key_here

# 3. Restart the backend to apply changes
npm start
```

**API Key Notes:**
- **COINGECKO_API_KEY**: Highly recommended for reliable price data
- **COINDESK_API_KEY**: Only needed if running historical backfill scripts
- **SCRAPER_API_KEY**: Has built-in fallback, but your own key prevents rate limiting
- **GOLD_API_KEY/METALS_API_KEY**: Only needed for Bitcoin vs Gold comparison feature

## ✅ Prerequisites

Verify your system meets these requirements:

```bash
# Check Node.js version (requires 20+)
node --version  # Should show v20.x.x or higher

# Check npm version (requires 9+)
npm --version   # Should show 9.x.x or higher

# Verify Git is installed
git --version
```

**If Node.js is not installed or version is too old:**
```bash
# Install Node.js 20+ using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

**System Requirements:**
- Node.js 20 or higher
- npm 9 or higher  
- 2GB+ available RAM
- 500MB+ disk space
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for blockchain API data
- SQLite3 CLI tool (optional, for database verification)
- Build tools (for native Node.js modules)

**Install Build Tools (required for better-sqlite3):**
```bash
# Ubuntu/Debian:
sudo apt-get install build-essential python3

# macOS:
xcode-select --install

# Windows:
# Install Visual Studio Build Tools or Visual Studio Community
# https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
```

**Install SQLite3 CLI (if not available):**
```bash
# Ubuntu/Debian:
sudo apt-get install sqlite3

# macOS:
brew install sqlite

# Windows:
# Download from https://sqlite.org/download.html
```

## 📋 First-Time Setup

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# (Optional) Create environment file
cp .env.example .env
# Edit .env if you want to customize port or database path

# Create data directory (required for database)
mkdir -p data

# Initialize database and create tables
node scripts/migrate.js

# Verify database was created
ls -la data/prices.sqlite  # Should show the database file
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# (Optional) Create environment file
echo "VITE_API_BASE_URL=http://localhost:5000/api" > .env
```

### Start Both Services

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
Expected output: `Server running on http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Expected output: `Local: http://localhost:5173/`

## 🔍 Verification Steps

After starting both services, verify everything is working:

### 1. Check Backend Health
```bash
curl http://localhost:5000/api/health
```
Expected: `{"status":"ok","timestamp":"..."}`

### 2. Test API Endpoints
```bash
# Test latest price endpoint
curl http://localhost:5000/api/prices/latest?symbol=BTC

# Test blockchain data
curl http://localhost:5000/api/blocks/latest?limit=1

# Test network metrics
curl http://localhost:5000/api/metrics/hashrate/history?timespan=30d
```

### 3. Verify Database Data
```bash
# Option A: Using SQLite3 CLI (if installed)
sqlite3 backend/data/prices.sqlite "SELECT COUNT(*) FROM prices;"
sqlite3 backend/data/prices.sqlite "SELECT COUNT(*) FROM blockchain_blocks;"

# Option B: Using API endpoints (recommended)
curl http://localhost:5000/api/prices/latest?symbol=BTC
curl http://localhost:5000/api/blocks/latest?limit=1

# Option C: Check backend logs for data collection
tail -f backend/server.log | grep -E "(Price|Block|Hashrate|Difficulty)"
```

### 4. Frontend Verification
- Open http://localhost:5173 in browser
- Check browser console (F12) for API connection errors
- Wait 5-10 minutes for charts to populate with data

### 5. Service Status Check
```bash
# All critical endpoints should respond:
curl -s http://localhost:5000/api/health && echo "✅ Backend healthy"
curl -s http://localhost:5173 > /dev/null && echo "✅ Frontend serving"
```

## 🔄 Background Services

The backend automatically starts 6 background services that collect blockchain data. These services run continuously and populate the database with real-time information.

### Service Overview

| Service | Data Collected | Collection Interval | Initial Availability |
|---------|----------------|-------------------|---------------------|
| **Price Poller** | BTC/USD prices from multiple exchanges | Every 5 minutes | 5 minutes |
| **Block Poller** | Latest blockchain blocks (height, hash, size) | Every 5 minutes | 5 minutes |
| **Treasury Updater** | Corporate Bitcoin holdings data | Every hour | 1 hour |
| **Hashrate Poller** | Network hashrate measurements | Every hour | 1 hour |
| **Difficulty Poller** | Mining difficulty adjustments | Every hour | 1 hour |
| **AI Prediction Poller** | Price prediction models | Every hour | 1 hour |

### Monitoring Data Collection

**Watch real-time service activity:**
```bash
# Follow backend logs to see services working
tail -f backend/server.log

# Filter for specific service activities
tail -f backend/server.log | grep -E "(Price poller|Block poller|Treasury|Hashrate|Difficulty)"
```

**Expected log output for healthy services:**
```
[INFO] Price poller started - collecting data every 5 minutes
[INFO] Block poller started - collecting data every 5 minutes  
[INFO] Hashrate poller started - collecting data every hour
[INFO] Difficulty poller started - collecting data every hour
[INFO] Treasury updater started - updating every hour
[INFO] AI prediction polling started - updating every hour
[INFO] Collected 50 new price records
[INFO] Collected 10 new blockchain blocks
```

**Check service status via API:**
```bash
# Verify each service has collected data
# Option A: Using jq (if installed)
curl -s http://localhost:5000/api/prices/latest?symbol=BTC | jq '.price'
curl -s http://localhost:5000/api/blocks/latest?limit=1 | jq '.[0].height'
curl -s http://localhost:5000/api/metrics/hashrate/history?timespan=1d | jq 'length'
curl -s http://localhost:5000/api/treasuries | jq 'length'

# Option B: Using grep/awk (no additional tools needed)
curl -s http://localhost:5000/api/prices/latest?symbol=BTC | grep -o '"price":[^,]*'
curl -s http://localhost:5000/api/blocks/latest?limit=1 | grep -o '"height":[^,]*'
curl -s http://localhost:5000/api/treasuries | grep -c '"company"'
```

### Data Collection Timeline

- **First 5 minutes:** Price data and recent blocks appear
- **First 30 minutes:** Sufficient price history for basic charts
- **First hour:** Network metrics (hashrate, difficulty) available
- **First hour:** Corporate treasury data loaded
- **Ongoing:** All services continue updating automatically

## ⚠️ Common Pitfalls & Troubleshooting

### Charts Show No Data
**Problem:** Frontend loads but charts are empty
**Causes & Solutions:**
- **Background services need time:** Wait 5-10 minutes after starting backend for data collection
- **API connection error:** Check browser console (F12) for CORS or network errors
- **Database empty:** Verify with `sqlite3 backend/data/prices.sqlite "SELECT COUNT(*) FROM prices;"`
- **Wrong API URL:** Ensure frontend/.env contains `VITE_API_BASE_URL=http://localhost:5000/api`

### Backend Won't Start
**Problem:** `npm start` fails with errors
**Common Solutions:**
```bash
# Check if port 5000 is already in use
lsof -i :5000
# Kill existing process or change PORT in .env file

# Reinstall dependencies if module errors occur
rm -rf node_modules package-lock.json
npm install

# Verify database migration completed
node scripts/migrate.js
```

### Frontend Build Errors
**Problem:** `npm install` or `npm run dev` fails
**Solutions:**
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Check Node.js version (must be 20+)
node --version
```

### Backend Build Errors (Windows)
**Problem:** `npm install` fails with better-sqlite3 compilation errors
**Solutions:**
```bash
# Windows-specific: Ensure Visual Studio Build Tools are installed
# Download from: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022

# Alternative: Use Windows Subsystem for Linux (WSL)
wsl --install
# Then follow Ubuntu instructions inside WSL
```

### Database Issues
**Problem:** SQLite database errors or missing data
**Solutions:**
```bash
# Recreate database from scratch
rm backend/data/prices.sqlite
cd backend && node scripts/migrate.js

# Check database permissions
ls -la backend/data/prices.sqlite

# Verify database has tables
sqlite3 backend/data/prices.sqlite ".tables"
```

### CORS Errors in Browser
**Problem:** "Access-Control-Allow-Origin" errors
**Solutions:**
- Ensure backend is running on port 5000
- Check frontend/.env has correct API URL
- Restart both services after fixing configuration

### External API Failures
**Problem:** No blockchain data being collected or rate limit errors
**Debugging:**
```bash
# Check backend logs for API errors
tail -f backend/server.log

# Test external API connectivity
curl https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd
curl https://blockchain.info/q/hashrate
```

### API Key Issues
**Problem:** Missing or invalid API keys causing feature limitations
**Symptoms & Solutions:**
- **Rate limit errors from CoinGecko:** Add `COINGECKO_API_KEY` to backend/.env
- **Corporate treasury data not loading:** Add `SCRAPER_API_KEY` or use built-in fallback
- **Historical candlestick data missing:** Add `COINDESK_API_KEY` for backfill scripts
- **Gold price comparison not working:** Add `GOLD_API_KEY` or `METALS_API_KEY`
- **API key authentication errors:** Verify keys are correct and properly formatted in .env

**Test API keys:**
```bash
# Test CoinGecko API key
curl -H "x-cg-demo-api-key: YOUR_API_KEY" https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd

# Test ScraperAPI key
curl "https://api.scraperapi.com/?api_key=YOUR_API_KEY&url=https://httpbin.org/ip"
```

### Memory/Performance Issues
**Problem:** System becomes slow or unresponsive
**Solutions:**
- Ensure minimum 2GB RAM available
- Close other applications while running
- Restart services if memory usage grows too high

### Port Conflicts
**Problem:** Services won't start due to port conflicts
**Solutions:**
```bash
# Find processes using ports 5000 or 5173
lsof -i :5000
lsof -i :5173

# Kill conflicting processes or use different ports
# Edit backend/.env: PORT=5001
# Edit frontend/.env: VITE_API_BASE_URL=http://localhost:5001/api
```

## 📚 Additional Resources

### Technology Stack

**Backend:**
- Node.js (ES Modules) with Express 5
- SQLite with better-sqlite3 for high-performance data storage
- Real-time data polling from blockchain.info, mempool.space, and other APIs
- RESTful API architecture with modular service layers

**Frontend:**
- React 19 with Vite build system
- Chart.js with react-chartjs-2 for interactive visualizations
- Responsive design with custom CSS
- Real-time data updates and interactive controls

### Project Structure

```
WIP/
├── backend/
│   ├── server.js                 # Express application entry point
│   ├── db.js                     # Database connection and initialization
│   ├── app/
│   │   ├── controllers/          # Request handlers and business logic
│   │   ├── db/                   # Database access layer
│   │   ├── routes/               # API route definitions
│   │   ├── services/             # Background services and data processors
│   │   └── utils/                # Utility functions
│   ├── config/                   # Configuration files
│   ├── data/                     # SQLite database storage
│   └── scripts/                  # Database migrations and utilities
├── frontend/
│   ├── src/
│   │   ├── Components/           # React UI components
│   │   ├── services/             # API client and hooks
│   │   ├── Styles/               # CSS stylesheets
│   │   └── utils/                # Frontend utilities
│   └── public/                   # Static assets
└── docs/                         # Project documentation
```

## Contributing

This project was developed as a Work Integrated Project. For contributions or questions, please contact:

- Email: decentralized.dev@gmail.com
- GitHub: https://github.com/MamidiPavanReddy

## License

MIT License

Copyright (c) 2025 Bitcoin Analytics Dashboard

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Acknowledgments

Data sources:
- blockchain.info API for hashrate and difficulty data
- mempool.space API for mempool and block data
- CoinGecko API for price data
- goldprice.org for gold price comparison

Built with modern web technologies and best practices for real-time data visualization and analysis.
