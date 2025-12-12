-- Fix divisions table to use state IDs instead of state codes
-- This script updates divisions to match the states table structure

-- Step 1: Add a temporary column for state_id
ALTER TABLE divisions 
ADD COLUMN IF NOT EXISTS state_id INT NULL AFTER state_code;

-- Step 2: Populate state_id by matching state_name_english
-- First, let's create a mapping based on common state codes
UPDATE divisions d
JOIN states s ON (
  -- Match by state code if states.state_code is VARCHAR
  (d.state_code = CAST(s.state_code AS CHAR))
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
SET d.state_id = s.id;

-- Step 3: Check how many divisions got matched
SELECT 
  COUNT(*) as total_divisions,
  COUNT(state_id) as matched_divisions,
  COUNT(*) - COUNT(state_id) as unmatched_divisions
FROM divisions;

-- Step 4: Show unmatched divisions (if any)
SELECT 
  d.id,
  d.division_code,
  d.division_name_english,
  d.state_code,
  d.state_id
FROM divisions d
WHERE d.state_id IS NULL;

