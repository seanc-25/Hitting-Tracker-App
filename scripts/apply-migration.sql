-- Apply this migration directly to your Supabase database
-- via the SQL Editor in the Supabase Dashboard

-- Make batting_side column required in at_bats table
-- This assumes the column already exists as nullable

BEGIN;

-- Step 1: Update any existing NULL values to 'Right' (default assumption)
UPDATE at_bats 
SET batting_side = 'Right' 
WHERE batting_side IS NULL;

-- Step 2: Normalize any existing values to proper case
UPDATE at_bats 
SET batting_side = 'Left' 
WHERE LOWER(TRIM(batting_side)) = 'left';

UPDATE at_bats 
SET batting_side = 'Right' 
WHERE LOWER(TRIM(batting_side)) = 'right';

-- Step 3: Add NOT NULL constraint to the existing column
ALTER TABLE at_bats 
ALTER COLUMN batting_side SET NOT NULL;

-- Step 4: Drop existing constraint if it exists (to avoid conflicts)
ALTER TABLE at_bats 
DROP CONSTRAINT IF EXISTS batting_side_check;

-- Step 5: Add check constraint to ensure only valid values
ALTER TABLE at_bats 
ADD CONSTRAINT batting_side_check 
CHECK (batting_side IN ('Left', 'Right'));

-- Step 5: Add column documentation
COMMENT ON COLUMN at_bats.batting_side IS 'The side the player hit from during this at-bat (left or right)';

COMMIT;

-- Verify the changes
SELECT 
    column_name, 
    is_nullable, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'at_bats' 
AND column_name = 'batting_side'; 