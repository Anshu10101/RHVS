-- Add YouTube video URL column to news table

ALTER TABLE news 
  ADD COLUMN IF NOT EXISTS youtube_video_url VARCHAR(500) NULL AFTER image_path,
  ADD INDEX IF NOT EXISTS idx_news_youtube (youtube_video_url(255));

