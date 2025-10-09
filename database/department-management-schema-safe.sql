-- Department Management Schema - Safe Version
-- Run this SQL to create the department management tables
-- This version uses INT UNSIGNED to match common MySQL patterns and avoid foreign key errors

-- Drop existing tables if they exist (in reverse order to respect foreign keys)
DROP TABLE IF EXISTS department_members;
DROP TABLE IF EXISTS department_posts;
DROP TABLE IF EXISTS departments;

-- Step 1: Create departments table
CREATE TABLE departments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
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

-- Step 2: Create department_posts table with foreign key
CREATE TABLE department_posts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  department_id INT UNSIGNED NOT NULL,
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

-- Step 3: Create department_members table with foreign keys
CREATE TABLE department_members (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  department_id INT UNSIGNED NOT NULL,
  post_id INT UNSIGNED NOT NULL,
  member_id INT UNSIGNED NOT NULL,
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

-- Step 4: Add state field to members table (if not exists)
-- Note: Skip this if you get a "Duplicate column name" error - it means the column already exists
-- ALTER TABLE members ADD COLUMN state VARCHAR(100);

-- Step 5: Add index for state field (only if not exists)
-- Note: Skip this if you get an error - it means the index already exists
-- CREATE INDEX idx_members_state ON members(state);

-- Step 6: Add department management permission to permission_types table if it exists
-- Note: Skip this if you get "Table doesn't exist" error - it means you don't have a permission_types table
-- INSERT IGNORE INTO permission_types (name, description, category)
-- VALUES ('manage_departments', 'Create and manage departments and assign members to posts', 'Administration');

-- ===========================================
-- SETUP COMPLETE!
-- ===========================================
-- Your department management tables are now created:
--   ✓ departments
--   ✓ department_posts  
--   ✓ department_members
--
-- You can now access the department management system at:
-- /admin/departments (superadmin only)
-- ===========================================
