-- run first this
ALTER TABLE department_members 
DROP INDEX IF EXISTS unique_member_in_dept_level;


-- then this
ALTER TABLE department_members DROP INDEX IF EXISTS unique_member_in_dept_level;