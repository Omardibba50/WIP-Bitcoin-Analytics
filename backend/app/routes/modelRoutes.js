import express from 'express';
import { getAllModels, insertModel } from '../db/modelsDb.js';
import { createModel, listModels } from '../controllers/modelController.js';

const router = express.Router();

// GET /api/models - List all models
router.get('/', (req, res) => {
  try {
    const models = getAllModels();
    res.json({ data: models });
  } catch (err) {
    console.error('Error fetching models:', err);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// POST /api/models - Create a new model
router.post('/', (req, res) => {
  try {
    const { id, name, description, version } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: 'Missing required fields: id, name' });
    }
    insertModel(id, name, description, version);
    res.status(201).json({ message: 'Model created successfully' });
  } catch (err) {
    console.error('Error creating model:', err);
    res.status(500).json({ error: 'Failed to create model' });
  }
});

export default router;
