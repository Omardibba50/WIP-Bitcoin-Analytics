# Bitcoin Analytics Dashboard

A comprehensive full-stack application for Bitcoin price tracking, network analysis, and predictive modeling. Built as a Work Integrated Project for Blockchain Development Program.

## Technology Stack

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

## Project Structure

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

## Core Features

### 1. Price Analytics
- Real-time Bitcoin price tracking from multiple sources
- Historical price data visualization with customizable timeframes
- Price performance analysis with percentage changes
- Interactive candlestick charts with OHLCV data
- Multi-symbol support (BTC, ETH, and other cryptocurrencies)

### 2. Network Metrics
- **Hash Rate Tracking:** Dual-axis visualization showing network hashrate vs BTC price correlation
- **Mining Difficulty Analysis:** Charts displaying difficulty adjustments with color-coded indicators
- **Block Explorer:** Real-time blockchain block information including height, hash, size, and miner details
- **Mempool Statistics:** Transaction queue monitoring and fee analysis

### 3. Statistical Analysis
- **Correlation Dashboard:** Pearson correlation coefficients between network metrics and price
- Strength classification (Strong/Moderate/Weak/Negative correlations)
- Interactive bar charts and ranking tables
- Configurable timespan analysis (30d, 90d, 1y)

### 4. Mining Economics
- Mining profitability calculations
- Block reward analysis
- Average transaction fees per block
- Network difficulty trends

### 5. Lightning Network
- Channel capacity tracking
- Network growth statistics
- Historical data visualization

### 6. Corporate Bitcoin Holdings
- Treasury tracking for major institutions
- Holdings percentage of total supply
- Market value calculations
- Company-level detail modals

### 7. Predictive Models
- Exponential Moving Average (EMA) models
- Live model performance tracking
- Prediction confidence scoring
- Historical accuracy analysis

### 8. Gold Comparison
- Bitcoin vs Gold price comparisons
- Market cap analysis
- Historical performance metrics

## Requirements

- Node.js 20 or higher
- npm 9 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/MamidiPavanReddy/WIP.git
cd WIP
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory (optional):

```env
PORT=5000
DB_PATH=./data/prices.sqlite
```

Initialize the database:

```bash
node scripts/migrate.js
```

Start the backend server:

```bash
npm start
```

The backend will be available at `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the frontend directory (optional):

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Database Schema

### Core Tables

**prices**
- Stores historical price data from multiple sources
- Indexed by symbol and timestamp for fast queries

**models**
- Predictive model metadata and configurations
- Version tracking and creation timestamps

**predictions**
- Model predictions with confidence scores
- Horizon-based forecasting (1h, 24h, 7d)

**blockchain_blocks**
- Real-time blockchain data
- Block height, hash, timestamp, size, transaction count

**corporate_treasuries**
- Corporate Bitcoin holdings
- Company name, BTC amount, USD value, percentage of supply

**hashrate_history**
- Network hashrate measurements over time
- Collected hourly from blockchain.info

**difficulty_history**
- Mining difficulty adjustments
- Percentage changes and block height tracking

**metric_correlations**
- Statistical correlations between metrics and price
- Cached results for performance optimization

### Indexes

All tables include optimized indexes on timestamp columns for efficient time-series queries.

## API Endpoints

### Price Endpoints

- `GET /api/prices/latest?symbol=BTC` - Latest price for a symbol
- `GET /api/prices/history?symbol=BTC&from=<ms>&to=<ms>&limit=<n>` - Historical price data
- `GET /api/prices/summary?symbol=BTC` - Price summary with 24h change

### Model Endpoints

- `GET /api/models` - List all predictive models
- `POST /api/models` - Create new model
- `GET /api/models/live` - Live model data

### Prediction Endpoints

- `GET /api/predictions?modelId=<id>` - Get predictions for a model
- `POST /api/predictions` - Create new prediction

### Blockchain Endpoints

- `GET /api/blocks/latest?limit=<n>` - Latest blockchain blocks
- `GET /api/blocks/:height` - Block details by height

### Network Metrics

- `GET /api/metrics/hashrate/history?timespan=<span>` - Hashrate historical data
- `GET /api/metrics/difficulty/history?timespan=<span>` - Difficulty historical data
- `GET /api/metrics/correlations?timespan=<span>&recalculate=<bool>` - Correlation analysis

### Treasury Endpoints

- `GET /api/treasuries` - Corporate Bitcoin holdings
- `GET /api/treasuries/totals` - Aggregated treasury statistics

### Lightning Network

- `GET /api/lightning/stats` - Lightning Network statistics

### Mining Economics

- `GET /api/mining/economics` - Mining profitability and economics data

### Mempool

- `GET /api/mempool/stats` - Current mempool statistics

### Health Check

- `GET /api/health` - API health status

For detailed API documentation, see [backend/API_ROUTES.md](backend/API_ROUTES.md)

## Background Services

The backend runs several automated services:

1. **Price Poller** - Updates BTC prices every 5 minutes
2. **Block Poller** - Fetches new blocks every 5 minutes
3. **Treasury Updater** - Updates corporate holdings hourly
4. **Hashrate Poller** - Collects network hashrate data hourly
5. **Difficulty Poller** - Tracks mining difficulty adjustments hourly
6. **OHLCV Updater** - Updates candlestick data every 5 minutes

## Frontend Components

### Dashboard Components

- **MainDashboard** - Primary application container
- **PriceChart** - Interactive price visualization with multiple timeframes
- **PriceCards** - Current price display with 24h changes
- **HashRateChart** - Dual-axis hashrate vs price correlation
- **DifficultyChart** - Mining difficulty trends with adjustment markers
- **CorrelationDashboard** - Statistical relationship analysis
- **BlockchainBlocks** - Recent block explorer
- **CorporateTreasuries** - Corporate Bitcoin holdings table
- **LightningNetwork** - Lightning Network statistics
- **MiningEconomics** - Mining profitability dashboard
- **PredictedNextBlock** - Next block prediction
- **ModelChart** - Predictive model performance
- **LiveModelsChart** - Real-time model tracking
- **BitcoinMetrics** - Key Bitcoin statistics

### UI Components

- **LoadingSpinner** - Loading state indicator
- **BlockDetailModal** - Detailed block information popup
- **CompanyDetailModal** - Corporate treasury details popup

## Configuration

### Environment Variables

**Backend (.env):**

```env
PORT=5000                           # Server port
DB_PATH=./data/prices.sqlite        # Database file path
```

**Frontend (.env):**

```env
VITE_API_BASE_URL=http://localhost:5000/api    # Backend API URL
```

## Development

### Running in Development Mode

Backend:
```bash
cd backend
npm start
```

Frontend:
```bash
cd frontend
npm run dev
```

### Building for Production

Frontend:
```bash
cd frontend
npm run build
npm run preview
```

### Linting

```bash
cd frontend
npm run lint
```

## Future Enhancements

See [docs/AI_MODEL_PLAN.md](docs/AI_MODEL_PLAN.md) for the comprehensive AI price prediction model implementation plan, including:

- Hybrid ensemble architecture (LSTM + Linear Regression + ARIMA)
- 15-feature engineering pipeline
- Training and validation workflows
- Performance targets: 80-85% accuracy, <100ms inference time
- Pure JavaScript implementation using brain.js

## Troubleshooting

### Database Issues

**Problem:** Database file not created
**Solution:** Run the migration script: `cd backend && node scripts/migrate.js`

**Problem:** Database locked errors
**Solution:** Ensure only one instance of the backend is running

### API Connection Issues

**Problem:** Frontend cannot connect to backend
**Solution:** 
- Verify backend is running on the correct port
- Check VITE_API_BASE_URL in frontend/.env
- Ensure CORS is properly configured

### Data Not Loading

**Problem:** Charts show no data
**Solution:**
- Wait for background pollers to collect initial data (5-10 minutes)
- Check browser console for API errors
- Verify database has data: `sqlite3 backend/data/prices.sqlite "SELECT COUNT(*) FROM prices;"`

### Module Import Errors

**Problem:** ESM import errors
**Solution:** This project uses ES Modules exclusively. Ensure all imports use `import`/`export` syntax and package.json includes `"type": "module"`

## Performance Optimization

- Database queries use prepared statements and indexes
- Frontend implements data sampling for large datasets
- API responses are cached where appropriate
- Background services use intervals to prevent rate limiting
- Chart rendering optimized with point reduction

## Security Considerations

For production deployment:
- Enable CORS origin allowlists
- Implement rate limiting
- Add request validation middleware
- Use environment-specific configurations
- Enable HTTPS
- Implement authentication for sensitive endpoints

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
