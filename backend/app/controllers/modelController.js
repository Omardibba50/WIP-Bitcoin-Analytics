// Handles model-related logic
import { insertModel, getAllModels } from '../db/modelsDb.js';

export function createModel(req, res) {
  try {
    const { id, name, description, version } = req.body;
    insertModel(id, name, description, version);
    res.status(201).json({ message: 'Model created successfully' });
  } catch (err) {
    console.error('Error creating model:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function listModels(req, res) {
  try {
    const models = getAllModels();
    res.json({ data: models });
  } catch (err) {
    console.error('Error listing models:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
