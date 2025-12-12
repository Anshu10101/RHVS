-- Debug script to check divisions data and state matching
-- Run this to verify divisions are properly linked to states
-- Uses pattern matching (same as API) to handle state_code type mismatch

-- 1. Check if divisions table exists and has data
SELECT COUNT(*) as total_divisions FROM divisions;

-- 2. Check sample divisions with state matching (using pattern matching like API)
SELECT 
  d.id,
  d.division_code,
  d.division_name_english,
  d.state_code,
  s.state_name_english,
  s.state_code as states_state_code
FROM divisions d
LEFT JOIN states s ON (
  -- Match by state name patterns (same logic as API)
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
LIMIT 10;

-- 3. Check for divisions with no matching state
SELECT 
  d.id,
  d.division_code,
  d.division_name_english,
  d.state_code
FROM divisions d
LEFT JOIN states s ON (
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
WHERE s.id IS NULL;

-- 4. Check states that should have divisions
SELECT 
  s.state_name_english,
  s.state_code,
  COUNT(d.id) as division_count
FROM states s
LEFT JOIN divisions d ON (
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
GROUP BY s.state_name_english, s.state_code
HAVING division_count > 0
ORDER BY division_count DESC
LIMIT 20;

-- 5. Test query for a specific state (replace 'Uttar Pradesh' with any state name)
SELECT 
  d.id,
  d.division_code,
  d.division_name_english,
  d.division_name_hindi,
  d.state_code,
  s.state_name_english
FROM divisions d
JOIN states s ON (
  s.state_name_english = 'Uttar Pradesh'
  AND d.state_code = 'UP'
)
ORDER BY d.division_name_english;

