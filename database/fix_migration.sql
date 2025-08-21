-- Docker Database Fixes for F1 Dashboard
-- Run this script to fix the specific constraints and schema issues

\echo 'Starting F1 Dashboard database fixes...'

-- Start transaction
BEGIN

-- Fix 1: Add teams unique constraint if missing
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
        RAISE NOTICE '✅ Added teams_name_year_unique constraint';
    ELSE
        RAISE NOTICE '✅ teams_name_year_unique constraint already exists';
    END IF;
EXCEPTION
    WHEN duplicate_table THEN
        RAISE NOTICE '⚠️ teams_name_year_unique constraint already exists';
    WHEN others THEN
        RAISE NOTICE '❌ Error adding teams constraint: %', SQLERRM;
END
$$;

-- Fix 2: Add lap_times unique constraint to prevent duplicates
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
        RAISE NOTICE '✅ Added lap_times_session_driver_lap_unique constraint';
    ELSE
        RAISE NOTICE '✅ lap_times_session_driver_lap_unique constraint already exists';
    END IF;
EXCEPTION
    WHEN duplicate_table THEN
        RAISE NOTICE '⚠️ lap_times_session_driver_lap_unique constraint already exists';
    WHEN others THEN
        RAISE NOTICE '❌ Error adding lap_times constraint: %', SQLERRM;
END
$$;

-- Fix 3: Ensure drivers have proper foreign key to teams
DO $$
BEGIN
    -- Check if the foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'drivers_team_id_fkey' 
        AND table_name = 'drivers'
        AND table_schema = 'public'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE drivers ADD CONSTRAINT drivers_team_id_fkey 
        FOREIGN KEY (team_id) REFERENCES teams(id);
        RAISE NOTICE '✅ Added drivers_team_id_fkey foreign key constraint';
    ELSE
        RAISE NOTICE '✅ drivers_team_id_fkey foreign key constraint already exists';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE '⚠️ drivers_team_id_fkey foreign key constraint already exists';
    WHEN others THEN
        RAISE NOTICE '❌ Error adding drivers foreign key: %', SQLERRM;
END
$$;

-- Fix 4: Clean up any orphaned data that might cause issues
DO $$
DECLARE
    orphaned_laps INTEGER;
    orphaned_drivers INTEGER;
BEGIN
    -- Remove lap times without valid session
    DELETE FROM lap_times 
    WHERE session_id NOT IN (SELECT id FROM f1_sessions);
    
    GET DIAGNOSTICS orphaned_laps = ROW_COUNT;
    RAISE NOTICE '🧹 Cleaned up % orphaned lap times without valid sessions', orphaned_laps;
    
    -- Remove lap times without valid driver
    DELETE FROM lap_times 
    WHERE driver_number NOT IN (SELECT driver_number FROM drivers);
    
    GET DIAGNOSTICS orphaned_drivers = ROW_COUNT;
    RAISE NOTICE '🧹 Cleaned up % orphaned lap times without valid drivers', orphaned_drivers;
END
$$;

-- Fix 5: Create Unknown Team if it doesn't exist for orphaned drivers
INSERT INTO teams (team_name, constructor_name, team_color, nationality, year, is_active)
VALUES ('Unknown Team', 'Unknown Constructor', '#808080', 'Unknown', 2023, true)
ON CONFLICT (team_name, year) DO NOTHING;

-- Fix 6: Update any drivers without team_id to Unknown Team
DO $$
DECLARE
    updated_drivers INTEGER;
    unknown_team_id INTEGER;
BEGIN
    -- Get Unknown Team ID
    SELECT id INTO unknown_team_id 
    FROM teams 
    WHERE team_name = 'Unknown Team' AND year = 2023 
    LIMIT 1;
    
    IF unknown_team_id IS NOT NULL THEN
        UPDATE drivers 
        SET team_id = unknown_team_id
        WHERE team_id IS NULL;
        
        GET DIAGNOSTICS updated_drivers = ROW_COUNT;
        RAISE NOTICE '👥 Updated % drivers to Unknown Team', updated_drivers;
    ELSE
        RAISE NOTICE '⚠️ Could not find Unknown Team';
    END IF;
END
$$;

-- Fix 7: Ensure session data integrity
UPDATE f1_sessions 
SET is_processed = false 
WHERE is_processed IS NULL;

-- Fix 8: Create missing indexes for better performance (ignore if they exist)
CREATE INDEX IF NOT EXISTS idx_lap_times_session_driver_lap 
ON lap_times(session_id, driver_number, lap_number);

CREATE INDEX IF NOT EXISTS idx_drivers_team_id 
ON drivers(team_id);

CREATE INDEX IF NOT EXISTS idx_teams_name_year 
ON teams(team_name, year);

-- Fix 9: Update table statistics for better query planning
ANALYZE teams;
ANALYZE drivers;
ANALYZE f1_sessions;
ANALYZE lap_times;

-- Commit all changes
COMMIT;

\echo '✅ All database fixes completed successfully!'

-- Display current database state
\echo 'Current database state:'

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

-- Show constraint status
\echo 'Current constraints:'

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