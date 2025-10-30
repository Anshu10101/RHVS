-- Simple Hero Images Setup
-- This script creates the hero images system without complex foreign key constraints

-- Drop existing tables if they exist (be careful with this in production)
DROP TABLE IF EXISTS hero_image_settings;
DROP TABLE IF EXISTS hero_images;

-- Table to store hero images
CREATE TABLE hero_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_path VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255) NOT NULL,
    title VARCHAR(255) NULL,
    description TEXT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    added_by INT NOT NULL,
    district_id INT NULL,
    state_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_display_order (display_order),
    INDEX idx_is_active (is_active),
    INDEX idx_district (district_id),
    INDEX idx_state (state_id)
);

-- Table to store hero image settings (without foreign key constraint)
CREATE TABLE hero_image_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT NULL,
    updated_by INT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default hero image settings
INSERT INTO hero_image_settings (setting_key, setting_value, description, updated_by) VALUES
('marquee_speed', '30', 'Marquee animation speed in seconds', NULL),
('image_display_duration', '3', 'How long each image is displayed in seconds', NULL),
('auto_play', 'true', 'Whether marquee auto-plays', NULL),
('show_indicators', 'true', 'Whether to show image indicators', NULL),
('transition_effect', 'slide', 'Transition effect between images', NULL);

-- Add hero image management permissions to available_permissions
INSERT IGNORE INTO available_permissions (permission_key, permission_name, description, category) VALUES
('manage_hero_images', 'Manage Hero Images', 'Can add, edit, and delete hero section images', 'content'),
('manage_hero_settings', 'Manage Hero Settings', 'Can modify hero section display settings', 'content');
