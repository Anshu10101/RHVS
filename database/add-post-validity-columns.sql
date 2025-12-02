-- Add validity columns to department_members table for 1-year post validity
-- Default: valid_from = assigned_at, valid_until = assigned_at + 1 year
-- Admin can override valid_until for custom durations (e.g., 2 years, 1.5 years)

ALTER TABLE department_members
ADD COLUMN IF NOT EXISTS valid_from DATE NULL COMMENT 'Start date of post validity (defaults to assigned_at)',
ADD COLUMN IF NOT EXISTS valid_until DATE NULL COMMENT 'End date of post validity (defaults to assigned_at + 1 year, admin can override)';

-- Create index for efficient cron queries
CREATE INDEX IF NOT EXISTS idx_valid_until ON department_members(valid_until);

-- Update existing records: set valid_from = assigned_at, valid_until = assigned_at + 1 year
UPDATE department_members
SET 
  valid_from = DATE(assigned_at),
  valid_until = DATE_ADD(DATE(assigned_at), INTERVAL 1 YEAR)
WHERE valid_from IS NULL OR valid_until IS NULL;

-- Set default values for new records (via trigger or application logic)
-- Note: Application will set these values, but we can also set defaults at insert time
