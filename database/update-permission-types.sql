-- Add permission_type column to district_admin_permissions table
ALTER TABLE district_admin_permissions 
ADD COLUMN permission_type ENUM('permanent', 'temporary') DEFAULT 'temporary' AFTER permission;

-- Update existing member management permissions to permanent
UPDATE district_admin_permissions 
SET permission_type = 'permanent' 
WHERE permission IN ('view_members', 'add_members', 'edit_members', 'verify_tokens', 'approve_members');

-- Update existing content management permissions to temporary
UPDATE district_admin_permissions 
SET permission_type = 'temporary' 
WHERE permission IN ('edit_gallery', 'edit_news_events', 'edit_about', 'edit_store', 'edit_offices');

-- Create content_origin table to track content by district
CREATE TABLE IF NOT EXISTS content_origin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_type ENUM('news', 'event', 'product', 'gallery', 'office') NOT NULL,
  content_id INT NOT NULL,
  district_id VARCHAR(100) NOT NULL,
  state_id VARCHAR(100) NOT NULL,
  added_by_admin_id INT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (added_by_admin_id) REFERENCES district_admins(id) ON DELETE CASCADE,
  INDEX idx_content (content_type, content_id),
  INDEX idx_district (district_id),
  INDEX idx_state (state_id)
);

-- Update available_permissions to categorize by type
ALTER TABLE available_permissions 
ADD COLUMN default_type ENUM('permanent', 'temporary') DEFAULT 'temporary' AFTER category;

-- Update existing permissions with their default types
UPDATE available_permissions 
SET default_type = 'permanent' 
WHERE permission_key IN ('view_members', 'add_members', 'edit_members', 'verify_tokens', 'approve_members');

-- Add new permissions for content management
INSERT INTO available_permissions (permission_key, permission_name, description, category, default_type) VALUES
('add_news', 'Add News', 'Can add news items for their district', 'content', 'temporary'),
('edit_news', 'Edit News', 'Can edit news items for their district', 'content', 'temporary'),
('delete_news', 'Delete News', 'Can delete news items for their district', 'content', 'temporary'),
('add_events', 'Add Events', 'Can add events for their district', 'content', 'temporary'),
('edit_events', 'Edit Events', 'Can edit events for their district', 'content', 'temporary'),
('delete_events', 'Delete Events', 'Can delete events for their district', 'content', 'temporary'),
('add_products', 'Add Products', 'Can add products to the store for their district', 'store', 'temporary'),
('edit_products', 'Edit Products', 'Can edit products in the store for their district', 'store', 'temporary'),
('delete_products', 'Delete Products', 'Can delete products from the store for their district', 'store', 'temporary'),
('add_gallery', 'Add Gallery Items', 'Can add images to the gallery for their district', 'content', 'temporary'),
('delete_gallery', 'Delete Gallery Items', 'Can delete images from the gallery for their district', 'content', 'temporary'),
('add_offices', 'Add Offices', 'Can add office information for their district', 'content', 'temporary'),
('edit_offices', 'Edit Offices', 'Can edit office information for their district', 'content', 'temporary'),
('delete_offices', 'Delete Offices', 'Can delete office information for their district', 'content', 'temporary'),
('verify_tokens', 'Verify Registration Tokens', 'Can verify registration tokens for their district', 'members', 'permanent'),
('approve_members', 'Approve Pending Members', 'Can approve pending member registrations for their district', 'members', 'permanent')
ON DUPLICATE KEY UPDATE 
  permission_name = VALUES(permission_name), 
  description = VALUES(description), 
  category = VALUES(category),
  default_type = VALUES(default_type);
