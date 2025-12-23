/**
 * Database Migration Runner
 * Run with: node backend/migrations/run-migration.js
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = path.join(__dirname, '../data/prices.sqlite');
const MIGRATION_FILE = path.join(__dirname, 'add_predicted_for_ts.sql');

console.log('🔄 Starting database migration...\n');
console.log(`Database: ${DB_PATH}`);
console.log(`Migration: ${MIGRATION_FILE}\n`);

// Check if database exists
if (!fs.existsSync(DB_PATH)) {
  console.error('❌ Database not found at:', DB_PATH);
  process.exit(1);
}

// Check if migration file exists
if (!fs.existsSync(MIGRATION_FILE)) {
  console.error('❌ Migration file not found at:', MIGRATION_FILE);
  process.exit(1);
}

try {
  // Open database
  const db = new Database(DB_PATH);
  console.log('✅ Database connection established\n');

  // Read migration SQL
  const migrationSQL = fs.readFileSync(MIGRATION_FILE, 'utf8');
  
  // Remove comment lines and split by semicolon
  const cleanedSQL = migrationSQL
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');
  
  const statements = cleanedSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`📝 Executing ${statements.length} SQL statements...\n`);

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip comments
    if (statement.startsWith('--')) continue;
    
    console.log(`[${i + 1}/${statements.length}] Executing...`);
    
    try {
      const result = db.prepare(statement).run();
      console.log(`✅ Success (changes: ${result.changes || 0})\n`);
    } catch (err) {
      // If it's just a "duplicate column" error, that's okay (already migrated)
      if (err.message.includes('duplicate column name')) {
        console.log('⚠️  Column already exists (migration previously applied)\n');
      } else {
        throw err;
      }
    }
  }

  // Verify the migration
  console.log('🔍 Verifying migration...\n');
  
  const tableInfo = db.prepare("PRAGMA table_info(predictions)").all();
  const hasPredictedForTs = tableInfo.some(col => col.name === 'predicted_for_ts');
  
  if (hasPredictedForTs) {
    console.log('✅ Column "predicted_for_ts" exists\n');
    
    // Check data
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_predictions,
        COUNT(predicted_for_ts) as with_predicted_for_ts,
        COUNT(*) - COUNT(predicted_for_ts) as missing_predicted_for_ts
      FROM predictions
    `).get();
    
    console.log('📊 Migration Statistics:');
    console.log(`   Total predictions: ${stats.total_predictions}`);
    console.log(`   With predicted_for_ts: ${stats.with_predicted_for_ts}`);
    console.log(`   Missing predicted_for_ts: ${stats.missing_predicted_for_ts}\n`);
    
    if (stats.missing_predicted_for_ts === 0) {
      console.log('🎉 Migration completed successfully!\n');
    } else {
      console.log('⚠️  Some rows are missing predicted_for_ts values\n');
    }
  } else {
    console.error('❌ Migration failed: Column not found\n');
    process.exit(1);
  }

  db.close();
  console.log('✅ Database connection closed\n');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error(error);
  process.exit(1);
}
