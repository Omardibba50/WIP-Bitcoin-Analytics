import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import priceRoutes from './app/routes/priceRoutes.js';
import modelRoutes from './app/routes/modelRoutes.js';
import predictionRoutes from './app/routes/predictionRoutes.js';
import { initDb } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database
initDb();

app.use(cors());
app.use(express.json());

// Base API route
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to the API',
    version: '1.0',
    endpoints: {
      health: '/api/health',
      prices: '/api/prices',
      models: '/api/models',
      predictions: '/api/predictions'
    }
  });
});

app.use('/api/prices', priceRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/predictions', predictionRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true, service: 'price-proxy' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
