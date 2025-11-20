-- Staged Uploads Table for temporary file storage
-- This table stores uploaded files temporarily before they are moved to permanent storage
-- Files are automatically cleaned up after their TTL expires

CREATE TABLE IF NOT EXISTS staged_uploads (
  id VARCHAR(255) PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  original_name VARCHAR(500),
  mime_type VARCHAR(100),
  size BIGINT,
  hash VARCHAR(64),
  data LONGBLOB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  INDEX idx_category (category),
  INDEX idx_expires_at (expires_at),
  INDEX idx_created_at (created_at)
);

