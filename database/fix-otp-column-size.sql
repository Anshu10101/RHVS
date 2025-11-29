-- Fix OTP column size to accommodate 'VERIFIED' status
-- The otp column needs to be larger than VARCHAR(6) to store 'VERIFIED' (8 characters)

-- Alter the otp column to VARCHAR(20) to accommodate both OTP codes (6 digits) and 'VERIFIED' status
ALTER TABLE admin_password_resets MODIFY COLUMN otp VARCHAR(20) NOT NULL;

