-- Add YouTube video URL column to photos table
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS youtube_video_url VARCHAR(500) NULL AFTER file_path,
  ADD COLUMN IF NOT EXISTS is_video BOOLEAN DEFAULT FALSE AFTER youtube_video_url,
  ADD INDEX IF NOT EXISTS idx_photos_youtube (youtube_video_url(255)),
  ADD INDEX IF NOT EXISTS idx_photos_is_video (is_video);

-- Make file_path nullable to support videos (videos don't have file_path, only youtube_video_url)
ALTER TABLE photos
  MODIFY COLUMN file_path VARCHAR(500) NULL;

-- Update existing photos to set is_video = FALSE
UPDATE photos SET is_video = FALSE WHERE is_video IS NULL;

