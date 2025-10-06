-- Migration script to replace gallery system with event-based photo management
-- Run this script to migrate from old gallery_albums/gallery_images to new system

-- Step 1: Create new tables
-- ==========================================

-- Photo Events Table
CREATE TABLE IF NOT EXISTS photo_events (
  id VARCHAR(50) PRIMARY KEY,
  event_name VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  event_type ENUM('meeting', 'festival', 'conference', 'sports', 'cultural', 'workshop', 'celebration', 'other') NOT NULL,
  location VARCHAR(255),
  description TEXT,
  status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
  is_public BOOLEAN DEFAULT TRUE,
  district VARCHAR(100),
  state VARCHAR(100),
  owner_admin_id INT,
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_event_date (event_date),
  INDEX idx_event_type (event_type),
  INDEX idx_event_status (status),
  INDEX idx_event_district (district),
  INDEX idx_event_owner (owner_admin_id)
);

-- Photo Galleries Table (replaces gallery_albums)
CREATE TABLE IF NOT EXISTS photo_galleries (
  id VARCHAR(50) PRIMARY KEY,
  event_id VARCHAR(50),
  gallery_name VARCHAR(255) NOT NULL,
  description TEXT,
  cover_photo VARCHAR(500),
  photo_count INT DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  district VARCHAR(100),
  state VARCHAR(100),
  owner_admin_id INT,
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES photo_events(id) ON DELETE CASCADE,
  INDEX idx_gallery_event (event_id),
  INDEX idx_gallery_district (district),
  INDEX idx_gallery_owner (owner_admin_id),
  INDEX idx_gallery_featured (is_featured)
);

-- Photos Table (enhanced replacement for gallery_images)
CREATE TABLE IF NOT EXISTS photos (
  id VARCHAR(50) PRIMARY KEY,
  gallery_id VARCHAR(50),
  event_id VARCHAR(50),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  file_path VARCHAR(500) NOT NULL,
  thumbnail_path VARCHAR(500),
  medium_path VARCHAR(500), -- Medium resolution for web
  file_size BIGINT,
  dimensions VARCHAR(20), -- "1920x1080"
  file_type VARCHAR(50), -- "image/jpeg"
  camera_info JSON, -- EXIF data
  tags JSON,
  caption TEXT,
  photographer VARCHAR(100),
  upload_source ENUM('admin', 'member', 'bulk_import', 'mobile') DEFAULT 'admin',
  upload_session_id VARCHAR(50), -- Track batch uploads
  is_featured BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,
  is_visible BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  view_count INT DEFAULT 0,
  download_count INT DEFAULT 0,
  district VARCHAR(100),
  state VARCHAR(100),
  owner_admin_id INT,
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (gallery_id) REFERENCES photo_galleries(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES photo_events(id) ON DELETE CASCADE,
  INDEX idx_photo_gallery (gallery_id),
  INDEX idx_photo_event (event_id),
  INDEX idx_photo_featured (is_featured),
  INDEX idx_photo_visible (is_visible),
  INDEX idx_photo_approved (is_approved),
  INDEX idx_photo_district (district),
  INDEX idx_photo_owner (owner_admin_id),
  INDEX idx_photo_upload_session (upload_session_id),
  INDEX idx_photo_created (created_at)
);

-- Upload Sessions Table (track batch uploads)
CREATE TABLE IF NOT EXISTS upload_sessions (
  id VARCHAR(50) PRIMARY KEY,
  event_id VARCHAR(50),
  gallery_id VARCHAR(50),
  admin_id INT NOT NULL,
  session_name VARCHAR(255),
  status ENUM('active', 'completed', 'failed', 'cancelled') DEFAULT 'active',
  total_files INT DEFAULT 0,
  uploaded_files INT DEFAULT 0,
  failed_files INT DEFAULT 0,
  total_size BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (event_id) REFERENCES photo_events(id) ON DELETE CASCADE,
  FOREIGN KEY (gallery_id) REFERENCES photo_galleries(id) ON DELETE CASCADE,
  INDEX idx_session_event (event_id),
  INDEX idx_session_admin (admin_id),
  INDEX idx_session_status (status)
);

-- Photo Analytics Table (track usage)
CREATE TABLE IF NOT EXISTS photo_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  photo_id VARCHAR(50) NOT NULL,
  action_type ENUM('view', 'download', 'share', 'like') NOT NULL,
  user_id VARCHAR(100),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
  INDEX idx_analytics_photo (photo_id),
  INDEX idx_analytics_action (action_type),
  INDEX idx_analytics_date (created_at)
);

-- Photo Tags Table (normalized tags for better search)
CREATE TABLE IF NOT EXISTS photo_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  photo_id VARCHAR(50) NOT NULL,
  tag_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
  UNIQUE KEY unique_photo_tag (photo_id, tag_name),
  INDEX idx_tag_name (tag_name)
);

-- Step 2: Migrate existing data (if any)
-- ==========================================

-- Note: This migration assumes you want to preserve existing gallery data
-- If you want to start fresh, skip this section

-- Create a default event for existing gallery data
INSERT INTO photo_events (id, event_name, event_date, event_type, description, status, is_public, created_by)
VALUES ('legacy-gallery', 'Legacy Gallery', CURDATE(), 'other', 'Migrated from old gallery system', 'completed', TRUE, 'system');

-- Migrate gallery_albums to photo_galleries
INSERT INTO photo_galleries (
  id, event_id, gallery_name, description, cover_photo, is_public, 
  district, state, owner_admin_id, created_by, created_at, updated_at
)
SELECT 
  id, 
  'legacy-gallery' as event_id,
  name as gallery_name,
  description,
  cover_image as cover_photo,
  isVisible as is_public,
  district,
  state,
  owner_admin_id,
  created_by,
  created_at,
  updated_at
FROM gallery_albums;

-- Migrate gallery_images to photos
INSERT INTO photos (
  id, title, description, file_path, thumbnail_path, gallery_id, event_id,
  is_visible, tags, district, state, owner_admin_id, created_by, created_at, updated_at, uploaded_by
)
SELECT 
  id,
  title,
  description,
  image_path as file_path,
  thumbnail_path,
  album_id as gallery_id,
  'legacy-gallery' as event_id,
  isVisible as is_visible,
  tags,
  district,
  state,
  owner_admin_id,
  created_by,
  created_at,
  updated_at,
  uploaded_by
FROM gallery_images;

-- Step 3: Drop old tables
-- ==========================================

-- Drop old gallery tables
DROP TABLE IF EXISTS gallery_images;
DROP TABLE IF EXISTS gallery_albums;

-- Step 4: Create indexes for performance
-- ==========================================

-- Additional indexes for better performance
CREATE INDEX idx_photos_search ON photos(is_visible, is_approved, created_at);
CREATE INDEX idx_events_search ON photo_events(is_public, event_date, event_type);
CREATE INDEX idx_galleries_search ON photo_galleries(is_public, event_id);

-- Step 5: Create views for easier querying
-- ==========================================

-- View for photo details with event and gallery info
CREATE VIEW photo_details AS
SELECT 
  p.*,
  e.event_name,
  e.event_date,
  e.event_type,
  e.location as event_location,
  g.gallery_name,
  g.description as gallery_description
FROM photos p
LEFT JOIN photo_events e ON p.event_id = e.id
LEFT JOIN photo_galleries g ON p.gallery_id = g.id;

-- View for gallery statistics
CREATE VIEW gallery_stats AS
SELECT 
  g.id,
  g.gallery_name,
  g.event_id,
  e.event_name,
  e.event_date,
  COUNT(p.id) as photo_count,
  SUM(p.file_size) as total_size,
  MAX(p.created_at) as last_photo_date,
  g.created_by,
  g.created_at
FROM photo_galleries g
LEFT JOIN photos p ON g.id = p.gallery_id
LEFT JOIN photo_events e ON g.event_id = e.id
GROUP BY g.id, g.gallery_name, g.event_id, e.event_name, e.event_date, g.created_by, g.created_at;

-- Step 6: Create stored procedures for common operations
-- ==========================================

DELIMITER //

-- Procedure to create a new photo event with default gallery
CREATE PROCEDURE CreatePhotoEvent(
  IN p_id VARCHAR(50),
  IN p_event_name VARCHAR(255),
  IN p_event_date DATE,
  IN p_event_type VARCHAR(50),
  IN p_location VARCHAR(255),
  IN p_description TEXT,
  IN p_district VARCHAR(100),
  IN p_state VARCHAR(100),
  IN p_owner_admin_id INT,
  IN p_created_by VARCHAR(100)
)
BEGIN
  DECLARE gallery_id VARCHAR(50);
  
  -- Create the event
  INSERT INTO photo_events (id, event_name, event_date, event_type, location, description, district, state, owner_admin_id, created_by)
  VALUES (p_id, p_event_name, p_event_date, p_event_type, p_location, p_description, p_district, p_state, p_owner_admin_id, p_created_by);
  
  -- Create default gallery for the event
  SET gallery_id = CONCAT('gallery-', p_id);
  INSERT INTO photo_galleries (id, event_id, gallery_name, description, district, state, owner_admin_id, created_by)
  VALUES (gallery_id, p_id, CONCAT('Photos from ', p_event_name), p_description, p_district, p_state, p_owner_admin_id, p_created_by);
  
  SELECT p_id as event_id, gallery_id;
END //

-- Procedure to update photo counts
CREATE PROCEDURE UpdatePhotoCounts()
BEGIN
  -- Update gallery photo counts
  UPDATE photo_galleries g
  SET photo_count = (
    SELECT COUNT(*) 
    FROM photos p 
    WHERE p.gallery_id = g.id AND p.is_visible = TRUE
  );
  
  -- Update event photo counts (if needed)
  -- This can be added later if needed
END //

DELIMITER ;

-- Step 7: Insert sample data for testing
-- ==========================================

-- Insert sample events
INSERT INTO photo_events (id, event_name, event_date, event_type, location, description, status, is_public, created_by) VALUES
('event-1', 'Annual General Meeting 2024', '2024-01-15', 'meeting', 'Community Center', 'Annual general meeting with all members', 'completed', TRUE, 'admin'),
('event-2', 'Holi Celebration', '2024-03-10', 'festival', 'Temple Grounds', 'Colorful Holi celebration with traditional activities', 'completed', TRUE, 'admin'),
('event-3', 'Sports Tournament', '2024-02-20', 'sports', 'Sports Complex', 'Inter-district sports tournament', 'completed', TRUE, 'admin'),
('event-4', 'Cultural Workshop', '2024-04-05', 'workshop', 'Cultural Center', 'Traditional arts and crafts workshop', 'upcoming', TRUE, 'admin');

-- Create galleries for each event
CALL CreatePhotoEvent('event-1', 'Annual General Meeting 2024', '2024-01-15', 'meeting', 'Community Center', 'Annual general meeting with all members', 'District A', 'State X', 1, 'admin');
CALL CreatePhotoEvent('event-2', 'Holi Celebration', '2024-03-10', 'festival', 'Temple Grounds', 'Colorful Holi celebration with traditional activities', 'District A', 'State X', 1, 'admin');
CALL CreatePhotoEvent('event-3', 'Sports Tournament', '2024-02-20', 'sports', 'Sports Complex', 'Inter-district sports tournament', 'District A', 'State X', 1, 'admin');
CALL CreatePhotoEvent('event-4', 'Cultural Workshop', '2024-04-05', 'workshop', 'Cultural Center', 'Traditional arts and crafts workshop', 'District A', 'State X', 1, 'admin');

-- Step 8: Grant permissions (adjust as needed)
-- ==========================================

-- Grant necessary permissions to your application user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON photo_events TO 'your_app_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON photo_galleries TO 'your_app_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON photos TO 'your_app_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON upload_sessions TO 'your_app_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON photo_analytics TO 'your_app_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON photo_tags TO 'your_app_user'@'localhost';

-- Step 9: Create cleanup procedures
-- ==========================================

DELIMITER //

-- Procedure to clean up old analytics data
CREATE PROCEDURE CleanupOldAnalytics(IN days_to_keep INT)
BEGIN
  DELETE FROM photo_analytics 
  WHERE created_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
END //

-- Procedure to optimize photo storage
CREATE PROCEDURE OptimizePhotoStorage()
BEGIN
  -- Update photo counts
  CALL UpdatePhotoCounts();
  
  -- Clean up orphaned records
  DELETE FROM photos WHERE gallery_id NOT IN (SELECT id FROM photo_galleries);
  DELETE FROM photos WHERE event_id NOT IN (SELECT id FROM photo_events);
  DELETE FROM photo_galleries WHERE event_id NOT IN (SELECT id FROM photo_events);
  
  -- Clean up old upload sessions
  DELETE FROM upload_sessions WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) AND status = 'completed';
END //

DELIMITER ;

-- Migration completed successfully!
-- ==========================================
-- The old gallery_albums and gallery_images tables have been replaced with:
-- 1. photo_events - Event management
-- 2. photo_galleries - Gallery management  
-- 3. photos - Enhanced photo storage
-- 4. upload_sessions - Batch upload tracking
-- 5. photo_analytics - Usage analytics
-- 6. photo_tags - Normalized tags
-- 7. Views and stored procedures for easier management
