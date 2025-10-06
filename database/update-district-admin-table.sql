-- Update existing district_admins table to support the new system
-- This script adds missing columns to your existing table

-- Add missing columns to district_admins table
ALTER TABLE district_admins 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE AFTER member_id,
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) AFTER email,
ADD COLUMN IF NOT EXISTS role ENUM('admin') DEFAULT 'admin' AFTER password_hash,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL AFTER expires_at;

-- Add indexes for better performance
ALTER TABLE district_admins 
ADD INDEX IF NOT EXISTS idx_email (email),
ADD INDEX IF NOT EXISTS idx_district (district),
ADD INDEX IF NOT EXISTS idx_member (member_id);

-- Create district_admin_permissions table
CREATE TABLE IF NOT EXISTS district_admin_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  district_admin_id INT NOT NULL,
  permission VARCHAR(50) NOT NULL,
  granted_by INT NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (district_admin_id) REFERENCES district_admins(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES superadmin(id) ON DELETE CASCADE,
  INDEX idx_admin_permission (district_admin_id, permission),
  INDEX idx_expires (expires_at)
);

-- Create available_permissions table
CREATE TABLE IF NOT EXISTS available_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  permission_key VARCHAR(50) UNIQUE NOT NULL,
  permission_name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default permissions
INSERT INTO available_permissions (permission_key, permission_name, description, category) VALUES
('view_members', 'View Members', 'Can view member listings for their district', 'members'),
('add_members', 'Add Members', 'Can add new members to their district', 'members'),
('edit_members', 'Edit Members', 'Can edit member details in their district', 'members'),
('manage_sellers', 'Manage Sellers', 'Can add, edit, and delete sellers for their district', 'sellers'),
('add_sellers', 'Add Sellers', 'Can add new sellers to their district', 'sellers'),
('edit_sellers', 'Edit Sellers', 'Can edit seller details in their district', 'sellers'),
('delete_sellers', 'Delete Sellers', 'Can delete sellers from their district', 'sellers'),
('view_sellers', 'View Sellers', 'Can view seller listings for their district', 'sellers'),
('edit_gallery', 'Edit Gallery', 'Can manage gallery images for their district', 'content'),
('edit_news_events', 'Edit News & Events', 'Can manage news and events for their district', 'content'),
('edit_about', 'Edit About', 'Can edit about page content for their district', 'content'),
('edit_store', 'Edit Store', 'Can manage store products for their district', 'store'),
('view_analytics', 'View Analytics', 'Can view analytics data for their district', 'analytics')
ON DUPLICATE KEY UPDATE permission_name = VALUES(permission_name), description = VALUES(description), category = VALUES(category);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  user_type ENUM('superadmin', 'district_admin') NOT NULL,
  action VARCHAR(50) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id, user_type),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
);
