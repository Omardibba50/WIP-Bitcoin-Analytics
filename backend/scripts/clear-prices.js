#!/usr/bin/env node
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../data/prices.sqlite');

const db = new Database(dbPath);

console.log('🗑️  Clearing prices table...');
const result = db.exec('DELETE FROM prices');
console.log('✅ Prices table cleared successfully');

db.close();
