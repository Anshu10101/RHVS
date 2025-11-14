-- Add National Executive Department Column
-- This column marks which department is the top-most National Executive Department
-- Only one department can be marked as the National Executive Department
-- This script is idempotent - safe to run multiple times

-- Step 1: Add the column to departments table (if it doesn't exist)
-- Check if column exists, if not add it
SET @dbname = DATABASE();
SET @tablename = 'departments';
SET @columnname = 'is_national_executive';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1', -- Column exists, do nothing
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' BOOLEAN DEFAULT FALSE NOT NULL COMMENT ''Marks this department as the National Executive Department (only one can be true)''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Step 2: Add an index for faster queries (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_is_national_executive ON departments(is_national_executive);

-- Step 3: Note on ensuring only one department can be marked as National Executive
-- MySQL doesn't allow updating the same table in a trigger that fires on that table,
-- so the application code handles this logic in the API endpoint.
-- The API endpoint (/api/departments/national-executive PATCH method) will:
-- 1. First unmark all other departments
-- 2. Then mark the selected department as National Executive
-- This ensures only one department can be marked at a time.

