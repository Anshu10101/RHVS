-- Fix marquee table to support emojis and 4-byte UTF-8 characters
-- This converts the text column to utf8mb4 character set

-- First, convert the table to utf8mb4
ALTER TABLE marquee CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Specifically ensure the text column uses utf8mb4
ALTER TABLE marquee MODIFY COLUMN text VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- Also update other text columns to be safe
ALTER TABLE marquee MODIFY COLUMN district VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;
ALTER TABLE marquee MODIFY COLUMN state VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

