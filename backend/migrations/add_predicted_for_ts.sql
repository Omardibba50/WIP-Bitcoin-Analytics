-- Migration: Add predicted_for_ts column to predictions table
-- This allows predictions to be plotted at their target time on charts
-- rather than at their creation time

-- Add the new column (nullable initially for backward compatibility)
ALTER TABLE predictions ADD COLUMN predicted_for_ts INTEGER;

-- For existing rows, calculate predicted_for_ts based on horizon
-- 1h = ts + 3600000 (1 hour in ms)
-- 24h = ts + 86400000 (24 hours in ms)
-- 7d = ts + 604800000 (7 days in ms)
UPDATE predictions 
SET predicted_for_ts = CASE 
  WHEN horizon = '1h' THEN ts + 3600000
  WHEN horizon = '24h' THEN ts + 86400000
  WHEN horizon = '7d' THEN ts + 604800000
  ELSE ts + 3600000  -- Default to 1h for legacy data
END
WHERE predicted_for_ts IS NULL;

-- Create index for efficient querying by predicted_for_ts
CREATE INDEX IF NOT EXISTS idx_predictions_predicted_for_ts ON predictions(predicted_for_ts);

-- Verify migration
SELECT 
  COUNT(*) as total_predictions,
  COUNT(predicted_for_ts) as with_predicted_for_ts,
  COUNT(*) - COUNT(predicted_for_ts) as missing_predicted_for_ts
FROM predictions;
