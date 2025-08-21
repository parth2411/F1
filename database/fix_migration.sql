-- Database Fix Migration for F1 Dashboard
-- Run this to fix any schema and constraint issues

-- Start transaction
BEGIN;

-- Fix 1: Ensure teams table has proper unique constraint
DO $$
BEGIN
    -- Check if the constraint exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'teams_name_year_unique' 
        AND table_name = 'teams'
        AND table_schema = 'public'
    ) THEN
        -- Add the constraint if it doesn't exist
        ALTER TABLE teams ADD CONSTRAINT teams_name_year_unique UNIQUE (team_name, year);
        RAISE NOTICE 'Added teams_name_year_unique constraint';
    ELSE
        RAISE NOTICE 'teams_name_year_unique constraint already exists';
    END IF;
END
$$;

-- Fix 2: Ensure lap_times table has proper unique constraint to prevent duplicates
DO $$
BEGIN
    -- Check if the constraint exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'lap_times_session_driver_lap_unique' 
        AND table_name = 'lap_times'
        AND table_schema = 'public'
    ) THEN
        -- Add the constraint if it doesn't exist
        ALTER TABLE lap_times ADD CONSTRAINT lap_times_session_driver_lap_unique 
        UNIQUE (session_id, driver_number, lap_number);
        RAISE NOTICE 'Added lap_times_session_driver_lap_unique constraint';
    ELSE
        RAISE NOTICE 'lap_times_session_driver_lap_unique constraint already exists';
    END IF;
END
$$;

-- Fix 3: Ensure proper foreign key constraints exist
DO $$
BEGIN
    -- Check drivers.team_id foreign key
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'drivers_team_id_fkey' 
        AND table_name = 'drivers'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE drivers ADD CONSTRAINT drivers_team_id_fkey 
        FOREIGN KEY (team_id) REFERENCES teams(id);
        RAISE NOTICE 'Added drivers_team_id_fkey constraint';
    ELSE
        RAISE NOTICE 'drivers_team_id_fkey constraint already exists';
    END IF;
END
$$;

-- Fix 4: Clean up any orphaned data that might cause issues
DELETE FROM lap_times 
WHERE session_id NOT IN (SELECT id FROM f1_sessions);

DELETE FROM lap_times 
WHERE driver_number NOT IN (SELECT driver_number FROM drivers);

-- Fix 5: Update any drivers without team_id
UPDATE drivers 
SET team_id = (
    SELECT id FROM teams 
    WHERE team_name = 'Unknown Team' 
    AND year = 2023 
    LIMIT 1
)
WHERE team_id IS NULL;

-- Fix 6: Create Unknown Team if it doesn't exist
INSERT INTO teams (team_name, constructor_name, team_color, nationality, year, is_active)
VALUES ('Unknown Team', 'Unknown Constructor', '#808080', 'Unknown', 2023, true)
ON CONFLICT (team_name, year) DO NOTHING;

-- Fix 7: Ensure session data integrity
UPDATE f1_sessions 
SET is_processed = false 
WHERE is_processed IS NULL;

-- Fix 8: Add missing indexes if they don't exist
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lap_times_session_driver_lap 
ON lap_times(session_id, driver_number, lap_number);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drivers_team_id 
ON drivers(team_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_teams_name_year 
ON teams(team_name, year);

-- Fix 9: Update table statistics
ANALYZE teams;
ANALYZE drivers;
ANALYZE f1_sessions;
ANALYZE lap_times;

-- Commit transaction
COMMIT;

-- Display current state
SELECT 
    'Teams' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT year) as years_count
FROM teams
UNION ALL
SELECT 
    'Drivers' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT CASE WHEN is_active THEN 1 END) as active_count
FROM drivers
UNION ALL
SELECT 
    'F1 Sessions' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT year) as years_count
FROM f1_sessions
UNION ALL
SELECT 
    'Lap Times' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT session_id) as sessions_count
FROM lap_times;

-- Show constraints status
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    string_agg(ccu.column_name, ', ' ORDER BY ccu.ordinal_position) as columns
FROM information_schema.table_constraints AS tc 
JOIN information_schema.constraint_column_usage AS ccu 
    ON ccu.constraint_name = tc.constraint_name 
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public' 
    AND tc.table_name IN ('teams', 'drivers', 'f1_sessions', 'lap_times')
    AND tc.constraint_type IN ('UNIQUE', 'FOREIGN KEY')
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;