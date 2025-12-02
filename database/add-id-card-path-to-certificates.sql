-- Add id_card_path column to certificates table to track ID card file paths
-- This allows cleanup of ID card files when posts expire

ALTER TABLE certificates
ADD COLUMN IF NOT EXISTS id_card_path VARCHAR(500) NULL COMMENT 'Path to the generated ID card file (e.g., /id-cards/appointment-id-card-XXX-123456.pdf)';

-- Create index for faster lookups during cleanup
CREATE INDEX IF NOT EXISTS idx_id_card_path ON certificates(id_card_path(255));
