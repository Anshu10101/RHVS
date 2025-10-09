-- Make created_by column nullable in departments table
ALTER TABLE departments MODIFY COLUMN created_by INT UNSIGNED NULL;

-- Drop foreign key constraint if it exists
SET foreign_key_checks = 0;
ALTER TABLE departments DROP FOREIGN KEY IF EXISTS departments_ibfk_1;
ALTER TABLE departments DROP FOREIGN KEY IF EXISTS fk_departments_superadmin;
SET foreign_key_checks = 1;

-- Verify the structure was updated
SHOW COLUMNS FROM departments LIKE 'created_by';

-- Check if all department tables exist
SHOW TABLES LIKE 'department%';
