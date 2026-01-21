-- Email Queue System for Retry and Failure Handling
-- Run this migration to add email queue functionality

-- Create email_queue table (WITHOUT foreign keys to avoid errors)
CREATE TABLE IF NOT EXISTS email_queue (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Email details
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255) NULL,
  email_type ENUM('appointment_certificate', 'removal_notification', 'test', 'other') NOT NULL,
  email_subject VARCHAR(500) NULL,
  
  -- Email data (JSON containing all template data)
  email_data JSON NOT NULL,
  
  -- Attachment paths
  certificate_path VARCHAR(500) NULL,
  id_card_path VARCHAR(500) NULL,
  
  -- Queue status
  status ENUM('pending', 'processing', 'sent', 'failed', 'cancelled') DEFAULT 'pending',
  priority INT DEFAULT 5 COMMENT '1=highest, 10=lowest',
  
  -- Retry logic
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 5,
  last_error TEXT NULL,
  last_error_code VARCHAR(50) NULL,
  
  -- Timing
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_attempt_at DATETIME NULL,
  next_retry_at DATETIME NULL COMMENT 'When to retry next (exponential backoff)',
  sent_at DATETIME NULL,
  
  -- Metadata (stored as regular INT without foreign keys)
  related_member_id INT NULL COMMENT 'References members.id',
  related_certificate_id INT NULL COMMENT 'References certificates.id',
  created_by_admin_id INT NULL COMMENT 'References district_admins.id or NULL for superadmin',
  
  -- Indexes for performance
  INDEX idx_status_next_retry (status, next_retry_at),
  INDEX idx_recipient (recipient_email),
  INDEX idx_member (related_member_id),
  INDEX idx_certificate (related_certificate_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create view for failed emails that need attention
CREATE OR REPLACE VIEW failed_emails_view AS
SELECT 
  id,
  recipient_email,
  recipient_name,
  email_type,
  retry_count,
  max_retries,
  last_error,
  created_at,
  last_attempt_at
FROM email_queue
WHERE status = 'failed' 
  AND retry_count >= max_retries
ORDER BY created_at DESC;

-- Create view for pending retries
CREATE OR REPLACE VIEW pending_retries_view AS
SELECT 
  id,
  recipient_email,
  email_type,
  retry_count,
  next_retry_at,
  TIMESTAMPDIFF(MINUTE, NOW(), next_retry_at) as minutes_until_retry,
  last_error
FROM email_queue
WHERE status = 'pending' 
  AND next_retry_at IS NOT NULL
  AND retry_count < max_retries
ORDER BY next_retry_at ASC;

-- Add email_queue_id column to certificates table (run this separately if certificates table exists)
-- ALTER TABLE certificates ADD COLUMN email_queue_id INT NULL COMMENT 'References email_queue.id';
-- ALTER TABLE certificates ADD INDEX idx_email_queue (email_queue_id);

-- Optional: Add foreign keys manually after both tables exist (run these separately if needed)
-- ALTER TABLE email_queue ADD CONSTRAINT fk_email_queue_member 
--   FOREIGN KEY (related_member_id) REFERENCES members(id) ON DELETE SET NULL;
-- ALTER TABLE email_queue ADD CONSTRAINT fk_email_queue_certificate 
--   FOREIGN KEY (related_certificate_id) REFERENCES certificates(id) ON DELETE SET NULL;
-- ALTER TABLE certificates ADD CONSTRAINT fk_certificates_email_queue
--   FOREIGN KEY (email_queue_id) REFERENCES email_queue(id) ON DELETE SET NULL;

-- Sample statistics query (for reference)
-- SELECT 
--   email_type,
--   status,
--   COUNT(*) as count,
--   AVG(retry_count) as avg_retries
-- FROM email_queue
-- WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
-- GROUP BY email_type, status;
