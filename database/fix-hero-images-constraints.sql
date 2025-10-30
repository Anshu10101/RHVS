-- Fix hero image constraints
-- This script fixes the foreign key constraints for the hero images system

-- First, check if the table exists and drop any existing foreign key constraints
-- This will work regardless of the constraint name
SET @constraint_name = (
    SELECT CONSTRAINT_NAME 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'hero_image_settings' 
    AND COLUMN_NAME = 'updated_by' 
    AND REFERENCED_TABLE_NAME IS NOT NULL
    LIMIT 1
);

-- Drop the existing foreign key constraint if it exists
SET @sql = IF(@constraint_name IS NOT NULL, 
    CONCAT('ALTER TABLE hero_image_settings DROP FOREIGN KEY ', @constraint_name), 
    'SELECT "No foreign key constraint found" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add the correct foreign key constraint with ON DELETE SET NULL
ALTER TABLE hero_image_settings 
ADD CONSTRAINT hero_image_settings_ibfk_1 
FOREIGN KEY (updated_by) REFERENCES district_admins(id) ON DELETE SET NULL;

-- Now insert the default settings
INSERT INTO hero_image_settings (setting_key, setting_value, description, updated_by) VALUES
('marquee_speed', '30', 'Marquee animation speed in seconds', NULL),
('image_display_duration', '3', 'How long each image is displayed in seconds', NULL),
('auto_play', 'true', 'Whether marquee auto-plays', NULL),
('show_indicators', 'true', 'Whether to show image indicators', NULL),
('transition_effect', 'slide', 'Transition effect between images', NULL)
ON DUPLICATE KEY UPDATE 
setting_value = VALUES(setting_value),
description = VALUES(description);

-- Add hero image management permissions to available_permissions (if not exists)
INSERT IGNORE INTO available_permissions (permission_key, permission_name, description, category) VALUES
('manage_hero_images', 'Manage Hero Images', 'Can add, edit, and delete hero section images', 'content'),
('manage_hero_settings', 'Manage Hero Settings', 'Can modify hero section display settings', 'content');

