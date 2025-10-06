-- Make profile photo mandatory in members table
-- First, update any existing NULL values to a default placeholder
UPDATE members 
SET profile_photo_path = '/uploads/default-avatar.svg' 
WHERE profile_photo_path IS NULL OR profile_photo_path = '';

-- Now make the column NOT NULL
ALTER TABLE members 
MODIFY COLUMN profile_photo_path VARCHAR(500) NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_members_profile_photo ON members(profile_photo_path);

-- Also update registration_tokens table to make profile photo mandatory
UPDATE registration_tokens 
SET profile_photo_path = '/uploads/default-avatar.svg' 
WHERE profile_photo_path IS NULL OR profile_photo_path = '';

ALTER TABLE registration_tokens 
MODIFY COLUMN profile_photo_path VARCHAR(500) NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_registration_tokens_profile_photo ON registration_tokens(profile_photo_path);
