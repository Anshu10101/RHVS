-- Fix profile photo paths in the database
-- This script updates existing records to have proper paths

-- Update members table - fix paths that don't start with /
UPDATE members 
SET profile_photo_path = CONCAT('/', profile_photo_path)
WHERE profile_photo_path IS NOT NULL 
  AND profile_photo_path != '' 
  AND profile_photo_path != '/uploads/default-avatar.svg'
  AND NOT profile_photo_path LIKE 'http%'
  AND NOT profile_photo_path LIKE '/%';

-- Update registration_tokens table - fix paths that don't start with /
UPDATE registration_tokens 
SET profile_photo_path = CONCAT('/', profile_photo_path)
WHERE profile_photo_path IS NOT NULL 
  AND profile_photo_path != '' 
  AND profile_photo_path != '/uploads/default-avatar.svg'
  AND NOT profile_photo_path LIKE 'http%'
  AND NOT profile_photo_path LIKE '/%';

-- Show the updated paths
SELECT id, name, profile_photo_path FROM members WHERE profile_photo_path IS NOT NULL;
SELECT id, name, profile_photo_path FROM registration_tokens WHERE profile_photo_path IS NOT NULL;
