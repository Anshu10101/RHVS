-- Remove member location validation from department_members trigger
-- This allows superadmin to appoint any member to any location
-- The API layer will still enforce location restrictions for district admins

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
  
  -- Validate state exists in states table (not members table)
  IF NEW.state IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM states WHERE state_name_english = NEW.state LIMIT 1
  ) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Invalid state specified';
  END IF;
  
  -- Validate district exists for the state in districts table (not members table)
  IF NEW.district IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM districts d
    JOIN states s ON (
      -- Match by state code if types match
      CAST(d.state_code AS CHAR) = CAST(s.state_code AS CHAR)
      OR
      -- Match by state name patterns as fallback
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
    WHERE s.state_name_english = NEW.state 
      AND d.district_name_english = NEW.district
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
  
  -- REMOVED: Member location validation
  -- Previously checked if member belongs to specified state/district
  -- This validation is now handled in the API layer where we can check user permissions
  -- Superadmin can appoint any member to any location, district admins are restricted by API validation
END //

DELIMITER ;
