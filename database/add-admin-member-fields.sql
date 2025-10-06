-- Add missing fields to members table for admin direct member registration
-- Run this SQL to update the existing members table

-- The members table already has most required fields:
-- - state (VARCHAR) - stores state name
-- - district (VARCHAR) - stores district name  
-- - aadhar_card_number (VARCHAR) - stores aadhar number
-- - verified_by_admin_id (INT) - tracks which admin verified
-- - verification_date (TIMESTAMP) - when verified
-- - status (ENUM) - member status
-- - department (VARCHAR) - member department
-- - verified_by_member_id (INT) - tracks which member verified

-- Add indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_members_state ON members(state);
CREATE INDEX IF NOT EXISTS idx_members_district ON members(district);
CREATE INDEX IF NOT EXISTS idx_members_aadhar ON members(aadhar_card_number);
CREATE INDEX IF NOT EXISTS idx_members_verified_admin ON members(verified_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_members_verified_member ON members(verified_by_member_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_department ON members(department);
