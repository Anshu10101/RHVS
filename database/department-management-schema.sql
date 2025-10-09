-- Department Management Schema
-- Run this SQL to create the department management tables

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name_en VARCHAR(255) NOT NULL COMMENT 'English name of the department',
  name_hi VARCHAR(255) NOT NULL COMMENT 'Hindi name of the department',
  level ENUM('national', 'state', 'district') NOT NULL COMMENT 'Level of the department',
  state VARCHAR(100) NULL COMMENT 'State name if level is state or district',
  district VARCHAR(100) NULL COMMENT 'District name if level is district',
  created_by INT NULL COMMENT 'Reference to superadmin who created the department',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_dept_name_level (name_en, level, state, district),
  INDEX idx_level (level),
  INDEX idx_state (state),
  INDEX idx_district (district),
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create department posts table
CREATE TABLE IF NOT EXISTS department_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL,
  name_en VARCHAR(255) NOT NULL COMMENT 'English name of the post',
  name_hi VARCHAR(255) NOT NULL COMMENT 'Hindi name of the post',
  position_order INT NOT NULL COMMENT 'Order of the post in the department hierarchy (1 is president)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_post_dept (department_id, position_order),
  INDEX idx_position (position_order),
  INDEX idx_department (department_id),
  CONSTRAINT fk_dept_posts_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create department members table (for assigning members to posts)
CREATE TABLE IF NOT EXISTS department_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL,
  post_id INT NOT NULL,
  member_id INT NOT NULL,
  assigned_by INT NULL COMMENT 'Reference to admin who assigned the member',
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_member_assignment (department_id, post_id),
  UNIQUE KEY unique_member_in_dept (department_id, member_id),
  INDEX idx_member (member_id),
  INDEX idx_department (department_id),
  INDEX idx_post (post_id),
  INDEX idx_assigned_by (assigned_by),
  CONSTRAINT fk_dept_members_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  CONSTRAINT fk_dept_members_post FOREIGN KEY (post_id) REFERENCES department_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_dept_members_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add state field to members table if it doesn't exist
ALTER TABLE members ADD COLUMN IF NOT EXISTS state VARCHAR(100);

-- Add index for state field
CREATE INDEX IF NOT EXISTS idx_members_state ON members(state);

-- Add department management permission to permission_types table if it exists
-- (This assumes you have a permission_types table from your permission management system)
INSERT IGNORE INTO permission_types (name, description, category)
VALUES ('manage_departments', 'Create and manage departments and assign members to posts', 'Administration');
