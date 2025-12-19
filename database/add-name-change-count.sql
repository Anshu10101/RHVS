-- Add name_change_count column to members table
-- This tracks how many times a member has changed their name via self-verification
-- Maximum allowed is 3 changes

ALTER TABLE members 
ADD COLUMN name_change_count INT DEFAULT 0 NOT NULL;

-- Set default value for existing members (if any have NULL, set to 0)
UPDATE members SET name_change_count = 0 WHERE name_change_count IS NULL;

-- Add index for better query performance (optional but recommended)
CREATE INDEX idx_members_name_change_count ON members(name_change_count);
