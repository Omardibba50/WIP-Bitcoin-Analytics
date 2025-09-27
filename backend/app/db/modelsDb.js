import { getDb } from '../../db.js';

export function insertModel(id, name, description, version, createdAt = Date.now()) {
  const d = getDb();
  const stmt = d.prepare('INSERT INTO models(id, name, description, version, created_at) VALUES (?, ?, ?, ?, ?)');
  return stmt.run(id, name, description, version, createdAt);
}

export function getAllModels() {
  const d = getDb();
  return d.prepare('SELECT * FROM models').all();
}
