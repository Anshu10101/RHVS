-- Update registration_tokens table to include new fields
ALTER TABLE registration_tokens 
ADD COLUMN IF NOT EXISTS state VARCHAR(100) AFTER address,
ADD COLUMN IF NOT EXISTS aadhar_card_number VARCHAR(12) AFTER district;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_registration_tokens_state ON registration_tokens(state);
CREATE INDEX IF NOT EXISTS idx_registration_tokens_aadhar ON registration_tokens(aadhar_card_number);

-- Update members table to include missing fields if they don't exist
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS state VARCHAR(100) AFTER address,
ADD COLUMN IF NOT EXISTS aadhar_card_number VARCHAR(12) UNIQUE AFTER district;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_state ON members(state);
CREATE INDEX IF NOT EXISTS idx_members_aadhar ON members(aadhar_card_number);
