-- Add district/state ownership to content tables for per-district scoping

-- Gallery Images
ALTER TABLE gallery_images 
  ADD COLUMN IF NOT EXISTS district VARCHAR(100) NULL AFTER tags,
  ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL AFTER district,
  ADD COLUMN IF NOT EXISTS owner_admin_id INT NULL AFTER state,
  ADD INDEX IF NOT EXISTS idx_gallery_images_district (district),
  ADD INDEX IF NOT EXISTS idx_gallery_images_state (state),
  ADD INDEX IF NOT EXISTS idx_gallery_images_owner (owner_admin_id);

-- Gallery Albums
ALTER TABLE gallery_albums 
  ADD COLUMN IF NOT EXISTS district VARCHAR(100) NULL AFTER isVisible,
  ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL AFTER district,
  ADD COLUMN IF NOT EXISTS owner_admin_id INT NULL AFTER state,
  ADD INDEX IF NOT EXISTS idx_gallery_albums_district (district),
  ADD INDEX IF NOT EXISTS idx_gallery_albums_state (state),
  ADD INDEX IF NOT EXISTS idx_gallery_albums_owner (owner_admin_id);

-- Products
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS district VARCHAR(100) NULL AFTER tags,
  ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL AFTER district,
  ADD COLUMN IF NOT EXISTS owner_admin_id INT NULL AFTER state,
  ADD INDEX IF NOT EXISTS idx_products_district (district),
  ADD INDEX IF NOT EXISTS idx_products_state (state),
  ADD INDEX IF NOT EXISTS idx_products_owner (owner_admin_id);

-- News
ALTER TABLE news 
  ADD COLUMN IF NOT EXISTS district VARCHAR(100) NULL AFTER `order`,
  ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL AFTER district,
  ADD COLUMN IF NOT EXISTS owner_admin_id INT NULL AFTER state,
  ADD INDEX IF NOT EXISTS idx_news_district (district),
  ADD INDEX IF NOT EXISTS idx_news_state (state),
  ADD INDEX IF NOT EXISTS idx_news_owner (owner_admin_id);

-- Events
ALTER TABLE events 
  ADD COLUMN IF NOT EXISTS district VARCHAR(100) NULL AFTER isVisible,
  ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL AFTER district,
  ADD COLUMN IF NOT EXISTS owner_admin_id INT NULL AFTER state,
  ADD INDEX IF NOT EXISTS idx_events_district (district),
  ADD INDEX IF NOT EXISTS idx_events_state (state),
  ADD INDEX IF NOT EXISTS idx_events_owner (owner_admin_id);


