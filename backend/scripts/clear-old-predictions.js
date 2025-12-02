/**
 * Clear old EMA predictions and keep only LSTM predictions
 */

import { getDb } from '../db.js';

try {
  const db = getDb();
  
  console.log('🗑️  Checking for old predictions...');
  
  // Count old predictions
  const oldCount = db.prepare(`
    SELECT COUNT(*) as count FROM predictions 
    WHERE model_id NOT LIKE 'lstm%'
  `).get().count;
  
  console.log(`   Found ${oldCount} old predictions (non-LSTM)`);
  
  if (oldCount > 0) {
    // Delete old predictions
    const result = db.prepare(`
      DELETE FROM predictions 
      WHERE model_id NOT LIKE 'lstm%'
    `).run();
    
    console.log(`✅ Deleted ${result.changes} old predictions`);
  } else {
    console.log('✅ No old predictions to delete');
  }
  
  // Show current predictions
  const current = db.prepare(`
    SELECT model_id, predicted_price, confidence, ts 
    FROM predictions 
    ORDER BY ts DESC 
    LIMIT 5
  `).all();
  
  console.log('\n📊 Current predictions in database:');
  current.forEach((p, i) => {
    const date = new Date(p.ts).toLocaleString();
    console.log(`   ${i + 1}. Model: ${p.model_id}`);
    console.log(`      Price: $${p.predicted_price.toFixed(2)}`);
    console.log(`      Confidence: ${(p.confidence * 100).toFixed(1)}%`);
    console.log(`      Time: ${date}\n`);
  });
  
  console.log('✅ Database cleaned!\n');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
