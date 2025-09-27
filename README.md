# Crypto Price Prediction Monorepo

Full-stack application for BTC price tracking and prediction.

- Backend: Node.js (ES Modules), Express 5, SQLite (better-sqlite3)
- Frontend: React (Vite) dashboard with Chart.js




## Contents
- backend/: API server, DB access, migrations
- frontend/: React UI (Vite)


## Requirements
- Node.js 20+
- npm 9+


## Quick Start

1) Install dependencies

- Backend
  - cd backend
  - npm install

- Frontend
  - cd frontend
  - npm install

2) Configure environment

- Backend: create backend/.env (optional)
  - PORT=5000 (default)
  - DB_PATH=relative or absolute path to SQLite DB (optional; defaults to backend/data/prices.sqlite)

- Frontend: create frontend/.env (optional)
  - VITE_API_BASE=http://localhost:5000 (if your backend runs on a custom host/port)

3) Initialize database (creates tables and indexes)

- cd backend
- node scripts/migrate.js

4) Start services

- Backend
  - cd backend
  - node server.js
  - Server runs at http://localhost:5000

- Frontend
  - cd frontend
  - npm run dev
  - App runs at http://localhost:5173 (Vite default)


## Architecture Overview

- backend/server.js: Express bootstrap, routing, middleware, health endpoint
- backend/app/routes/*: HTTP route definitions
- backend/app/controllers/*: Request handling and orchestration
- backend/app/db/*: SQLite access layer (better-sqlite3)
- backend/scripts/migrate.js: DB schema creation and indexes
- frontend/src: React app, charts, and custom hooks


## Environment Variables

Backend (.env):
- PORT=5000
- DB_PATH=optional SQLite DB path (default: backend/data/prices.sqlite)

Frontend (.env):
- VITE_API_BASE=http://localhost:5000 (optional)


## Database

SQLite database file lives at backend/data/prices.sqlite by default. The migration script creates tables and indexes.

Tables:
- prices(id, symbol, source, price, ts)
- models(id, name, description, version, created_at)
- predictions(id, model_id, symbol, predicted_price, confidence, horizon, ts)
- market_snapshots(id, symbol, bid, ask, volume, ts) [reserved for future]

Indexes:
- CREATE INDEX IF NOT EXISTS idx_prices_symbol_ts ON prices(symbol, ts DESC)
- CREATE INDEX IF NOT EXISTS idx_predictions_model_ts ON predictions(model_id, ts DESC)

Run migrations whenever you pull schema changes:
- cd backend && node scripts/migrate.js


## API Reference (canonical)

Base URL: http://localhost:5000/api

Health
- GET /api/health -> { ok: true, service: 'price-proxy' }

Prices
- GET /api/prices/latest?symbol=BTC
  - Returns latest stored price for a symbol.
  - Example response:
    {
      "data": { "symbol": "BTC", "source": "coingecko", "price": 27000.5, "ts": 1695739200000 }
    }

- GET /api/prices/history?symbol=BTC&from=<ms>&to=<ms>&limit=<n>
  - Returns chronologically ordered price points for the symbol.

Models
- POST /api/models
  - Body: { id, name, description?, version? }

- GET /api/models
  - Returns all registered models.

Predictions
- POST /api/predictions
  - Body: { modelId, symbol, predictedPrice, confidence?, horizon? }

- GET /api/predictions?modelId=...
  - Returns predictions for the provided model.


## Frontend

- Vite React app with a dashboard (Chart.js)
- Custom hook (usePrice) polls price data and renders the main tile & charts
- To point at a different backend, set VITE_API_BASE in frontend/.env

Run:
- cd frontend && npm run dev

Build:
- cd frontend && npm run build && npm run preview


## Development

- Lint frontend: cd frontend && npm run lint
- Suggested improvements:
  - Centralized env validation
  - Add request validation (zod/celebrate) and error middleware
  - Structured logging (pino) and request logging
  - Rate limiting & CORS origin allowlists for production


## Troubleshooting

- DB file not created
  - Ensure you ran: cd backend && node scripts/migrate.js

- API requests failing from frontend
  - Ensure backend is running at PORT (default 5000)
  - If using VITE_API_BASE, verify the value is correct

- ESM vs CJS issues
  - This project uses ESM across backend; ensure imports/exports use `import`/`export`


## License

MIT
