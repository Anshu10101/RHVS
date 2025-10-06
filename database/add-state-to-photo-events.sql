-- Add state column to photo_events table for filtering
ALTER TABLE photo_events 
ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL AFTER district,
ADD INDEX IF NOT EXISTS idx_photo_events_state (state);

-- Update existing records to have state values based on district
-- This is a sample update - you may need to adjust based on your actual data
UPDATE photo_events 
SET state = 'Uttar Pradesh' 
WHERE district = 'Jhansi' AND state IS NULL;

-- Add more updates as needed for other districts
-- UPDATE photo_events 
-- SET state = 'Madhya Pradesh' 
-- WHERE district = 'Gwalior' AND state IS NULL;
