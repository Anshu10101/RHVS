-- Update departments table to make level, state, district optional
-- These will be determined when assigning members to posts

ALTER TABLE departments MODIFY COLUMN level ENUM('national', 'state', 'district') NULL;
ALTER TABLE departments MODIFY COLUMN state VARCHAR(100) NULL;
ALTER TABLE departments MODIFY COLUMN district VARCHAR(100) NULL;
ALTER TABLE departments MODIFY COLUMN created_by INT UNSIGNED NULL;

-- Drop the unique constraint that includes level
ALTER TABLE departments DROP INDEX unique_dept_name_level;

-- Add new unique constraint on just the name
ALTER TABLE departments ADD UNIQUE KEY unique_dept_name (name_en);

-- Verify the structure
SHOW COLUMNS FROM departments;
