-- Add name column to superadmin table
ALTER TABLE superadmin 
ADD COLUMN name VARCHAR(255) NULL AFTER email;

-- Update existing superadmin records to use email prefix as name (optional)
-- You can manually update these with actual names later
UPDATE superadmin 
SET name = SUBSTRING_INDEX(email, '@', 1)
WHERE name IS NULL;

