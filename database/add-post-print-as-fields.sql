-- Add print_as fields to department_posts table
-- These fields allow custom COMPLETE designation (post + department combined) to be printed on certificates and ID cards
-- If provided, this will be used instead of the default [level_prefix] [post] [department] format
-- If not provided, the system will use the default format
--
-- IMPORTANT: This script is safe to run on live database.
-- The columns are nullable (NULL DEFAULT NULL), so existing rows won't be affected.
-- If columns already exist, you'll get an error - ignore it, it means migration was already run.

ALTER TABLE `department_posts`
ADD COLUMN `print_as_name_en` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Complete English designation (post + department) to print on certificates/ID cards. If set, will be used with level prefix only.',
ADD COLUMN `print_as_name_hi` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Complete Hindi designation (post + department) to print on certificates/ID cards. If set, will be used with level prefix only.';

