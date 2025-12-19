-- Remove the `order` column and its index from the events and news tables
-- This script removes the ordering functionality from events and news

-- Events table
-- Drop the index first (if it exists)
DROP INDEX IF EXISTS idx_order ON events;

-- Drop the column
ALTER TABLE events DROP COLUMN IF EXISTS `order`;

-- News table
-- Drop the index first (if it exists)
DROP INDEX IF EXISTS idx_order ON news;

-- Drop the column
ALTER TABLE news DROP COLUMN IF EXISTS `order`;

-- Verify the columns are removed (optional - uncomment to check)
-- DESCRIBE events;
-- DESCRIBE news;

