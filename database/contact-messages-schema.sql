-- Contact Messages schema for member -> superadmin / district admin inbox
-- Run this on your MySQL database (same DB as the rest of the app)
-- Example:
--   mysql -u your_user -p your_db < database/contact-messages-schema.sql

-- Drop old table if it exists (safe when deploying this feature)
DROP TABLE IF EXISTS contact_messages;

CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Optional link to registered member (if we can resolve from reg number / email)
  member_id INT NULL,

  -- Basic sender info (always stored so admin can reply)
  sender_name VARCHAR(255) NOT NULL,
  sender_email VARCHAR(255) NOT NULL,
  sender_phone VARCHAR(50) NULL,
  sender_member_reg_number VARCHAR(50) NULL,

  -- Topic / category
  topic_key ENUM(
    'membership',
    'certificate',
    'email_issue',
    'content_issue',
    'technical',
    'store_issue',
    'complaint',
    'feedback',
    'other'
  ) NOT NULL,
  custom_topic VARCHAR(255) NULL,

  message TEXT NOT NULL,

  -- Routing
  target_type ENUM('superadmin', 'district_admin') NOT NULL DEFAULT 'superadmin',
  superadmin_id INT NULL,
  district_admin_id INT NULL,

  -- Status / lifecycle
  status ENUM('unread', 'read') NOT NULL DEFAULT 'unread',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,

  -- Our API will use hard DELETE by default to keep DB small.
  deleted_at TIMESTAMP NULL,

  -- Indexes only (no foreign-key constraints to avoid engine/type mismatches)
  INDEX idx_contact_target (target_type, superadmin_id, district_admin_id),
  INDEX idx_contact_status (status),
  INDEX idx_contact_created_at (created_at),
  INDEX idx_contact_member (member_id),
  INDEX idx_contact_sender_email (sender_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


