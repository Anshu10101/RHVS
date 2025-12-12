-- Add Divisional Level to Department Members
-- This script adds 'divisional' level support to the department_members table

-- Step 1: Add 'divisional' to the level ENUM
ALTER TABLE department_members 
MODIFY COLUMN level ENUM('national', 'state', 'district', 'divisional') NOT NULL COMMENT 'Level of assignment (national/state/district/divisional)';

-- Step 2: Add division column to store division name
ALTER TABLE department_members 
ADD COLUMN IF NOT EXISTS division VARCHAR(255) NULL COMMENT 'Division name if level is divisional';

-- Step 3: Add index for division column
CREATE INDEX IF NOT EXISTS idx_division ON department_members(division);

-- Step 4: Update unique constraints to include division
-- First, drop existing unique constraints
ALTER TABLE department_members DROP INDEX IF EXISTS unique_member_assignment;
ALTER TABLE department_members DROP INDEX IF EXISTS unique_member_in_dept_level;

-- Recreate unique constraints with division
ALTER TABLE department_members 
ADD UNIQUE KEY unique_member_assignment (department_id, post_id, level, state, district, division);

ALTER TABLE department_members 
ADD UNIQUE KEY unique_member_in_dept_level (department_id, member_id, level, state, district, division);

-- Step 5: Update certificates table to support divisional level
ALTER TABLE certificates 
MODIFY COLUMN level ENUM('national', 'state', 'district', 'divisional') NOT NULL;

ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS division VARCHAR(255) NULL COMMENT 'Division name if level is divisional';

CREATE INDEX IF NOT EXISTS idx_certificates_division ON certificates(division);

-- Step 6: Update or recreate trigger to handle divisional level
DROP TRIGGER IF EXISTS before_department_member_insert;

DELIMITER //

CREATE TRIGGER before_department_member_insert 
BEFORE INSERT ON department_members
FOR EACH ROW
BEGIN
  -- For national level, state, district, and division must be NULL
  IF NEW.level = 'national' AND (NEW.state IS NOT NULL OR NEW.district IS NOT NULL OR NEW.division IS NOT NULL) THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'National level assignments cannot have state, district, or division';
  END IF;
  
  -- For state level, state is required but district and division must be NULL
  IF NEW.level = 'state' AND (NEW.state IS NULL OR NEW.district IS NOT NULL OR NEW.division IS NOT NULL) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'State level assignments require state but cannot have district or division';
  END IF;
  
  -- For district level, both state and district are required, division must be NULL
  IF NEW.level = 'district' AND (NEW.state IS NULL OR NEW.district IS NULL OR NEW.division IS NOT NULL) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'District level assignments require both state and district, but cannot have division';
  END IF;
  
  -- For divisional level, state and division are required, district must be NULL
  IF NEW.level = 'divisional' AND (NEW.state IS NULL OR NEW.division IS NULL OR NEW.district IS NOT NULL) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Divisional level assignments require state and division, but cannot have district';
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
  
  -- Validate division exists for the state in divisions table
  IF NEW.division IS NOT NULL THEN
    -- Check if division exists for this state using pattern matching
    -- Since state_code types might not match, we match by state name patterns
    IF NOT EXISTS (
      SELECT 1 FROM divisions d
      CROSS JOIN states s
      WHERE s.state_name_english = NEW.state
        AND (
          -- Match by state code if types match
          CAST(d.state_code AS CHAR) = CAST(s.state_code AS CHAR)
          OR
          -- Match by state name patterns
          (d.state_code = 'AR' AND s.state_name_english LIKE '%Arunachal%')
          OR (d.state_code = 'AS' AND s.state_name_english LIKE '%Assam%')
          OR (d.state_code = 'BR' AND s.state_name_english LIKE '%Bihar%')
          OR (d.state_code = 'CT' AND s.state_name_english LIKE '%Chhattisgarh%')
          OR (d.state_code = 'HR' AND s.state_name_english LIKE '%Haryana%')
          OR (d.state_code = 'HP' AND s.state_name_english LIKE '%Himachal%')
          OR (d.state_code = 'JH' AND s.state_name_english LIKE '%Jharkhand%')
          OR (d.state_code = 'KA' AND s.state_name_english LIKE '%Karnataka%')
          OR (d.state_code = 'MP' AND s.state_name_english LIKE '%Madhya%')
          OR (d.state_code = 'MH' AND s.state_name_english LIKE '%Maharashtra%')
          OR (d.state_code = 'ML' AND s.state_name_english LIKE '%Meghalaya%')
          OR (d.state_code = 'NL' AND s.state_name_english LIKE '%Nagaland%')
          OR (d.state_code = 'OD' AND (s.state_name_english LIKE '%Odisha%' OR s.state_name_english LIKE '%Orissa%'))
          OR (d.state_code = 'PB' AND s.state_name_english LIKE '%Punjab%')
          OR (d.state_code = 'RJ' AND s.state_name_english LIKE '%Rajasthan%')
          OR (d.state_code = 'UP' AND (s.state_name_english = 'Uttar Pradesh' OR s.state_name_english LIKE 'Uttar Pradesh%'))
          OR (d.state_code = 'UT' AND s.state_name_english LIKE '%Uttarakhand%')
          OR (d.state_code = 'WB' AND s.state_name_english LIKE '%West Bengal%')
        )
        AND (d.division_name_english = NEW.division OR d.division_name_hindi = NEW.division)
      LIMIT 1
    ) THEN
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Invalid division specified for the state';
    END IF;
  END IF;
  
  -- Validate member belongs to the specified state
  IF (NEW.level = 'state' OR NEW.level = 'divisional') AND NOT EXISTS (
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

