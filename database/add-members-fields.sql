-- Add missing fields to members table for admin management
-- Run this SQL to update the existing members table

-- Add status field
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS status ENUM('pending', 'verified', 'rejected') DEFAULT 'verified';

-- Add district field
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS district VARCHAR(100);

-- Add department field
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- Add verified_by_member_id field (for tracking who verified the member)
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS verified_by_member_id INT;

-- Add foreign key constraint for verified_by_member_id
ALTER TABLE members 
ADD CONSTRAINT fk_verified_by_member 
FOREIGN KEY (verified_by_member_id) REFERENCES members(id) 
ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_district ON members(district);
CREATE INDEX IF NOT EXISTS idx_members_verified_by ON members(verified_by_member_id);

-- Update existing members to have verified status
UPDATE members SET status = 'verified' WHERE status IS NULL;
