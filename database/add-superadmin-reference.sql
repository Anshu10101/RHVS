-- Add superadmin reference member (RHVS000000) for admin registrations
-- This member record serves as the reference for all superadmin-added members

-- First check if the superadmin reference member already exists
INSERT INTO members (
  member_reg_number,
  name,
  email,
  phone,
  address,
  father_husband_name,
  mother_wife_name,
  registration_date,
  existing_member_reg_number,
  profile_photo_path,
  state,
  district,
  aadhar_card_number,
  status,
  department,
  verified_by_admin_id,
  verification_date,
  created_at,
  updated_at
) VALUES (
  'RHVS000000',
  'RHVS Superadmin',
  'admin@rhvs.org',
  '0000000000',
  'RHVS Head Office',
  'System Admin',
  'System Admin',
  '2024-01-01',
  'RHVS000000', -- Self-referenced
  '/uploads/default-avatar.svg',
  'System',
  'System',
  '000000000000',
  'verified',
  'Administration',
  NULL,
  NOW(),
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE
  name = 'RHVS Superadmin',
  email = 'admin@rhvs.org',
  phone = '0000000000',
  address = 'RHVS Head Office',
  father_husband_name = 'System Admin',
  mother_wife_name = 'System Admin',
  existing_member_reg_number = 'RHVS000000',
  profile_photo_path = '/uploads/default-avatar.svg',
  state = 'System',
  district = 'System',
  aadhar_card_number = '000000000000',
  status = 'verified',
  department = 'Administration',
  updated_at = NOW();

-- Update the comment to explain this special member
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS is_system_reference BOOLEAN DEFAULT FALSE;

-- Mark the superadmin reference member as system reference
UPDATE members 
SET is_system_reference = TRUE 
WHERE member_reg_number = 'RHVS000000';
