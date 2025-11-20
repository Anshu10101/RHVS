-- Add profile photo columns to superadmin table
-- This allows superadmins to upload and store their profile pictures

ALTER TABLE superadmin 
ADD COLUMN profile_photo_path VARCHAR(500) NULL AFTER name,
ADD COLUMN profile_photo_blob LONGBLOB NULL AFTER profile_photo_path;

-- Add index for better performance when querying by profile photo path
CREATE INDEX IF NOT EXISTS idx_superadmin_profile_photo ON superadmin(profile_photo_path);

-- Optional: Set default avatar for existing superadmins (uncomment if needed)
-- UPDATE superadmin 
-- SET profile_photo_path = '/uploads/default-avatar.svg'
-- WHERE profile_photo_path IS NULL;

