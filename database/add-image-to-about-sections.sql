-- Add image support to about_sections table
-- Run this SQL in your MySQL database

-- Add image_url column (if it doesn't exist)
-- Note: If column already exists, this will fail - that's okay, just skip it
ALTER TABLE about_sections 
ADD COLUMN image_url VARCHAR(500) NULL AFTER content;

-- Update ENUM to include 'image' type
ALTER TABLE about_sections 
MODIFY COLUMN type ENUM('hero', 'card', 'quote', 'paragraph', 'heading', 'image') NOT NULL;

