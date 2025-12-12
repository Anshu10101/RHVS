# Divisional Level Migration - Execution Order

## ⚠️ IMPORTANT: Read Before Running

These migrations add divisional level support to your database. Follow the order below.

## Execution Order

### 1. **`divisions-schema.sql`** (FIRST - Creates divisions table)
   - Creates `divisions` table
   - Inserts all division data
   - **Note:** Foreign key constraint may fail if `states.state_code` is INTEGER. The API uses pattern matching, so this is safe to ignore.
   - **Safe to re-run:** Uses `CREATE TABLE IF NOT EXISTS` and `INSERT IGNORE`

### 2. **`add-divisional-level.sql`** (SECOND - Adds divisional support)
   - Adds 'divisional' to ENUM in `department_members` and `certificates`
   - Adds `division` column to both tables
   - Updates unique constraints
   - Creates/updates trigger for validation
   - **Safe to re-run:** Uses `IF NOT EXISTS` and `DROP TRIGGER IF EXISTS`

### 3. **`check-divisions-data.sql`** (OPTIONAL - Verification)
   - Debug script to verify data integrity
   - **Safe:** Read-only queries, no data modification

### 4. **`fix-divisions-state-code.sql`** (OPTIONAL - Only if needed)
   - Adds `state_id` column to divisions table
   - Populates it by matching state names
   - **Only run if:** You want to add state_id for future use
   - **Safe to re-run:** Uses `IF NOT EXISTS`

## Safety Checklist

✅ All scripts use `IF NOT EXISTS` / `IF EXISTS` where applicable  
✅ All INSERT statements use `INSERT IGNORE` to prevent duplicates  
✅ No DROP TABLE statements (only DROP INDEX/TRIGGER)  
✅ All ALTER TABLE operations are additive (adding columns, not removing)  
✅ ENUM modifications are backward compatible (adding new value)

## Potential Issues

1. **Foreign Key Constraint:** If `states.state_code` is INTEGER and `divisions.state_code` is VARCHAR, the FK will fail. This is OK - the API doesn't rely on it.

2. **Trigger Recreation:** The trigger is dropped and recreated. If you have custom modifications, they'll be overwritten.

## Recommended Execution

```sql
-- Step 1: Create divisions table
SOURCE divisions-schema.sql;

-- Step 2: Add divisional level support
SOURCE add-divisional-level.sql;

-- Step 3: Verify (optional)
SOURCE check-divisions-data.sql;
```

## Rollback (if needed)

If you need to rollback:
1. Remove divisional assignments: `DELETE FROM department_members WHERE level = 'divisional';`
2. Remove division column: `ALTER TABLE department_members DROP COLUMN division;`
3. Revert ENUM: `ALTER TABLE department_members MODIFY COLUMN level ENUM('national', 'state', 'district') NOT NULL;`
4. Drop divisions table: `DROP TABLE IF EXISTS divisions;`

