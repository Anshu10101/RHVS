-- Fix ID Card Signature Type Migration
-- This migration:
-- 1. Updates any NULL certificate_type values to a temporary valid value
-- 2. Modifies the ENUM to include the new ID card types
-- 3. You can then manually update row 12 to 'membership_id_card' if needed

-- Step 1: Fix any NULL certificate_type values (set to 'membership' temporarily)
UPDATE certificate_signatures 
SET certificate_type = 'membership' 
WHERE certificate_type IS NULL OR certificate_type = '';

-- Step 2: Add new ID card types to the ENUM
ALTER TABLE certificate_signatures 
MODIFY COLUMN certificate_type ENUM('membership', 'appointment', 'membership_id_card', 'appointment_id_card') NOT NULL COMMENT 'Type of certificate this signature is for';

-- Step 3: After running this, manually update row 12 (or any other rows) to the correct type:
-- UPDATE certificate_signatures SET certificate_type = 'membership_id_card' WHERE id = 12;

