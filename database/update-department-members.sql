-- Drop and recreate department_members table with level information
DROP TABLE IF EXISTS department_members;

CREATE TABLE department_members (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  department_id INT UNSIGNED NOT NULL,
  post_id INT UNSIGNED NOT NULL,
  member_id INT UNSIGNED NOT NULL,
  level ENUM('national', 'state', 'district') NOT NULL COMMENT 'Level of assignment (national/state/district)',
  state VARCHAR(100) NULL COMMENT 'State name if level is state or district',
  district VARCHAR(100) NULL COMMENT 'District name if level is district',
  assigned_by INT UNSIGNED NULL COMMENT 'Reference to admin who assigned the member',
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Unique constraints to prevent duplicate assignments
  UNIQUE KEY unique_member_assignment (department_id, post_id, level, state, district),
  UNIQUE KEY unique_member_in_dept_level (department_id, member_id, level, state, district),
  
  -- Indexes for better query performance
  INDEX idx_member (member_id),
  INDEX idx_department (department_id),
  INDEX idx_post (post_id),
  INDEX idx_assigned_by (assigned_by),
  INDEX idx_level (level),
  INDEX idx_state (state),
  INDEX idx_district (district),
  
  -- Foreign key constraints
  CONSTRAINT fk_dept_members_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  CONSTRAINT fk_dept_members_post FOREIGN KEY (post_id) REFERENCES department_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_dept_members_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add validation triggers
DELIMITER //

CREATE TRIGGER before_department_member_insert 
BEFORE INSERT ON department_members
FOR EACH ROW
BEGIN
  -- For national level, state and district must be NULL
  IF NEW.level = 'national' AND (NEW.state IS NOT NULL OR NEW.district IS NOT NULL) THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'National level assignments cannot have state or district';
  END IF;
  
  -- For state level, state is required but district must be NULL
  IF NEW.level = 'state' AND (NEW.state IS NULL OR NEW.district IS NOT NULL) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'State level assignments require state but cannot have district';
  END IF;
  
  -- For district level, both state and district are required
  IF NEW.level = 'district' AND (NEW.state IS NULL OR NEW.district IS NULL) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'District level assignments require both state and district';
  END IF;
  
  -- Validate state exists in members table
  IF NEW.state IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM members WHERE state = NEW.state LIMIT 1
  ) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Invalid state specified';
  END IF;
  
  -- Validate district exists for the state in members table
  IF NEW.district IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM members 
    WHERE state = NEW.state AND district = NEW.district 
    LIMIT 1
  ) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Invalid district specified for the state';
  END IF;
  
  -- Validate member belongs to the specified state/district
  IF NEW.level = 'state' AND NOT EXISTS (
    SELECT 1 FROM members 
    WHERE id = NEW.member_id AND state = NEW.state
    LIMIT 1
  ) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Member does not belong to the specified state';
  END IF;
  
  IF NEW.level = 'district' AND NOT EXISTS (
    SELECT 1 FROM members 
    WHERE id = NEW.member_id 
    AND state = NEW.state 
    AND district = NEW.district
    LIMIT 1
  ) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Member does not belong to the specified district';
  END IF;
END //

DELIMITER ;
