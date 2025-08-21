-- Make batting_side column required in at_bats table
-- Date: 2024-01-01
-- Description: Add NOT NULL constraint to batting_side column and ensure valid values

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

-- Step 4: Add check constraint to ensure only valid values
-- Note: Using 'Left' and 'Right' with proper capitalization
ALTER TABLE at_bats 
ADD CONSTRAINT batting_side_check 
CHECK (batting_side IN ('Left', 'Right'));

-- Step 4: Add column documentation
COMMENT ON COLUMN at_bats.batting_side IS 'The side the player hit from during this at-bat (left or right)'; 