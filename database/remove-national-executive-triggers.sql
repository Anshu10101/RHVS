-- Remove triggers that cause MySQL error
-- MySQL doesn't allow updating the same table in a trigger that fires on that table

-- Drop the triggers if they exist
DROP TRIGGER IF EXISTS ensure_single_national_executive;
DROP TRIGGER IF EXISTS ensure_single_national_executive_insert;

-- Note: The application code now handles ensuring only one department can be marked as National Executive
-- The logic is in the API endpoint: /api/departments/national-executive (PATCH method)

