-- Create a default avatar placeholder for existing records
-- This ensures all members have a profile photo

-- First, create the uploads directory structure if it doesn't exist
-- (This would typically be done at the file system level, but we'll reference it)

-- Update any existing NULL or empty profile photo paths
UPDATE members 
SET profile_photo_path = '/uploads/default-avatar.svg' 
WHERE profile_photo_path IS NULL OR profile_photo_path = '' OR profile_photo_path = 'NULL';

UPDATE registration_tokens 
SET profile_photo_path = '/uploads/default-avatar.svg' 
WHERE profile_photo_path IS NULL OR profile_photo_path = '' OR profile_photo_path = 'NULL';

-- Verify the updates
SELECT COUNT(*) as members_with_profile_photos FROM members WHERE profile_photo_path IS NOT NULL AND profile_photo_path != '';
SELECT COUNT(*) as tokens_with_profile_photos FROM registration_tokens WHERE profile_photo_path IS NOT NULL AND profile_photo_path != '';
