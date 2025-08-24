#!/usr/bin/env python3
"""
Fixed F1 Data Processor
Addresses all database transaction and constraint issues
"""

import os
import sys
import json
import psycopg2
import psycopg2.extras
import redis
import fastf1
import pandas as pd
from datetime import datetime, timezone
from contextlib import contextmanager
import logging

class F1DataProcessor:
    def __init__(self):
        self.setup_logging()
        self.setup_fastf1()
        self.setup_connections()
        
    def setup_logging(self):
        """Set up logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        
    def setup_fastf1(self):
        """Set up FastF1 cache"""
        cache_dir = './cache'
        os.makedirs(cache_dir, exist_ok=True)
        fastf1.Cache.enable_cache(cache_dir)
        print(f"✅ FastF1 cache directory: {cache_dir}")
        
    def setup_connections(self):
        """Set up database and Redis connections"""
        # Database connection
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'f1_dashboard'),
            'user': os.getenv('DB_USER', 'f1_user'),
            'password': os.getenv('DB_PASSWORD', 'f1_password')
        }
        
        # Redis connection
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
        try:
            self.redis_client = redis.from_url(redis_url)
            self.redis_client.ping()
            print("✅ Redis connection successful")
        except Exception as e:
            print(f"❌ Redis connection failed: {e}")
            self.redis_client = None
            
    @contextmanager
    def get_db_connection(self):
        """Get database connection with proper error handling"""
        conn = None
        try:
            conn = psycopg2.connect(**self.db_config)
            conn.autocommit = False  # Use explicit transactions
            yield conn
        except Exception as e:
            if conn:
                conn.rollback()
            raise e
        finally:
            if conn:
                conn.close()
                
    def test_database_schema(self):
        """Test and fix database schema issues"""
        print("🔍 Testing database schema...")
        
        with self.get_db_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                # Check if teams table has the correct constraint
                cur.execute("""
                    SELECT 
                        tc.constraint_name,
                        string_agg(ccu.column_name, ', ' ORDER BY ccu.ordinal_position) as columns
                    FROM information_schema.table_constraints AS tc 
                    JOIN information_schema.constraint_column_usage AS ccu 
                        ON ccu.constraint_name = tc.constraint_name 
                        AND ccu.table_schema = tc.table_schema
                    WHERE tc.constraint_type = 'UNIQUE' 
                        AND tc.table_name = 'teams'
                        AND tc.table_schema = 'public'
                    GROUP BY tc.constraint_name;
                """)
                
                constraints = cur.fetchall()
                print(f"📊 Teams table unique constraints: {len(constraints)}")
                
                # Check if the required unique constraint exists
                has_team_year_constraint = False
                for constraint in constraints:
                    if 'team_name' in constraint['columns'] and 'year' in constraint['columns']:
                        has_team_year_constraint = True
                        print(f"✅ Found constraint: {constraint['constraint_name']} on ({constraint['columns']})")
                        break
                
                if not has_team_year_constraint:
                    print("⚠️ Missing team_name, year unique constraint. Adding it...")
                    try:
                        # Add the constraint if it doesn't exist
                        cur.execute("""
                            ALTER TABLE teams 
                            ADD CONSTRAINT teams_name_year_unique 
                            UNIQUE (team_name, year)
                        """)
                        conn.commit()
                        print("✅ Added missing unique constraint")
                    except psycopg2.Error as e:
                        if "already exists" in str(e):
                            print("✅ Constraint already exists")
                        else:
                            print(f"❌ Error adding constraint: {e}")
                        conn.rollback()
                
    def create_or_update_team(self, conn, team_name, driver_info, year=2023):
        """Create or update team record with better error handling"""
        try:
            # Extract team information
            constructor_name = driver_info.get('TeamName', team_name)
            team_color = driver_info.get('TeamColor', '#FFFFFF')
            if team_color and not team_color.startswith('#'):
                team_color = f"#{team_color}"
            nationality = driver_info.get('CountryCode', 'Unknown')
            
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                # First, try to find existing team
                cur.execute("""
                    SELECT id FROM teams 
                    WHERE team_name = %s AND year = %s
                """, (team_name, year))
                
                existing_team = cur.fetchone()
                
                if existing_team:
                    # Update existing team
                    cur.execute("""
                        UPDATE teams SET
                            constructor_name = %s,
                            team_color = %s,
                            nationality = %s,
                            is_active = %s
                        WHERE id = %s
                        RETURNING id
                    """, (constructor_name, team_color, nationality, True, existing_team['id']))
                    
                    result = cur.fetchone()
                    team_id = result['id']
                    print(f"✅ Updated team: {team_name} (ID: {team_id})")
                else:
                    # Insert new team
                    cur.execute("""
                        INSERT INTO teams (team_name, constructor_name, team_color, nationality, year, is_active)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        RETURNING id
                    """, (team_name, constructor_name, team_color, nationality, year, True))
                    
                    result = cur.fetchone()
                    team_id = result['id']
                    print(f"✅ Created team: {team_name} (ID: {team_id})")
                
                return team_id
                
        except Exception as e:
            print(f"❌ Error with team {team_name}: {e}")
            raise
    
    def create_or_update_driver(self, conn, driver_number, session, team_id):
        """Create or update driver record with better error handling"""
        try:
            # Get driver info from session
            driver_info = session.get_driver(driver_number)
            
            # Extract driver details with better error handling
            full_name = driver_info.get('FullName', f'Driver {driver_number}')
            first_name = driver_info.get('FirstName', '')
            last_name = driver_info.get('LastName', '')
            
            # If first/last name not available, split full name
            if not first_name and not last_name:
                name_parts = full_name.split()
                first_name = name_parts[0] if name_parts else 'Unknown'
                last_name = name_parts[-1] if len(name_parts) > 1 else 'Driver'
            
            abbreviation = driver_info.get('Abbreviation', str(driver_number)[:3])
            nationality = driver_info.get('CountryCode', 'Unknown')
            
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                # Use ON CONFLICT for drivers
                cur.execute("""
                    INSERT INTO drivers (driver_number, driver_code, full_name, first_name, last_name, 
                                       nationality, team_id, is_active)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (driver_number) DO UPDATE SET
                        driver_code = EXCLUDED.driver_code,
                        full_name = EXCLUDED.full_name,
                        first_name = EXCLUDED.first_name,
                        last_name = EXCLUDED.last_name,
                        nationality = EXCLUDED.nationality,
                        team_id = EXCLUDED.team_id,
                        is_active = EXCLUDED.is_active
                """, (
                    str(driver_number), 
                    abbreviation, 
                    full_name, 
                    first_name, 
                    last_name, 
                    nationality, 
                    team_id, 
                    True
                ))
                
                print(f"✅ Driver: {driver_number} - {full_name}")
                
        except Exception as e:
            print(f"❌ Error with driver {driver_number}: {e}")
            raise
    
    def create_session_record(self, conn, year, round_number, session_type, event_name):
        """Create session record and return session ID"""
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                # Check if session already exists
                cur.execute("""
                    SELECT id FROM f1_sessions 
                    WHERE year = %s AND round_number = %s AND session_type = %s
                """, (year, round_number, session_type))
                
                existing_session = cur.fetchone()
                
                if existing_session:
                    session_id = existing_session['id']
                    print(f"✅ Found existing session ID: {session_id}")
                else:
                    # Create new session
                    cur.execute("""
                        INSERT INTO f1_sessions (year, round_number, session_type, event_name, is_processed)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING id
                    """, (year, round_number, session_type, event_name, True))
                    
                    result = cur.fetchone()
                    session_id = result['id']
                    print(f"✅ Created session ID: {session_id}")
                
                return session_id
                
        except Exception as e:
            print(f"❌ Error creating session: {e}")
            raise
    
    def process_lap_times(self, conn, session_id, driver_number, laps):
        """Process lap times for a driver with better error handling"""
        lap_count = 0
        
        try:
            with conn.cursor() as cur:
                for _, lap in laps.iterrows():
                    if pd.isna(lap['LapNumber']):
                        continue
                        
                    try:
                        # Process compound
                        compound = None
                        if hasattr(lap, 'Compound') and pd.notna(lap.get('Compound')):
                            compound = str(lap['Compound'])
                        
                        # Process tyre life
                        tyre_life = None
                        if hasattr(lap, 'TyreLife') and pd.notna(lap.get('TyreLife')):
                            tyre_life = int(lap['TyreLife'])
                        
                        # Insert lap time
                        cur.execute("""
                            INSERT INTO lap_times (session_id, driver_number, lap_number, 
                                                 lap_time, sector1_time, sector2_time, sector3_time,
                                                 compound, tyre_life, is_personal_best)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (session_id, driver_number, lap_number) DO UPDATE SET
                                lap_time = EXCLUDED.lap_time,
                                sector1_time = EXCLUDED.sector1_time,
                                sector2_time = EXCLUDED.sector2_time,
                                sector3_time = EXCLUDED.sector3_time,
                                compound = EXCLUDED.compound,
                                tyre_life = EXCLUDED.tyre_life,
                                is_personal_best = EXCLUDED.is_personal_best
                        """, (
                            session_id,
                            str(driver_number),
                            int(lap['LapNumber']),
                            lap['LapTime'].total_seconds() if pd.notna(lap['LapTime']) else None,
                            lap['Sector1Time'].total_seconds() if pd.notna(lap['Sector1Time']) else None,
                            lap['Sector2Time'].total_seconds() if pd.notna(lap['Sector2Time']) else None,
                            lap['Sector3Time'].total_seconds() if pd.notna(lap['Sector3Time']) else None,
                            compound,
                            tyre_life,
                            lap.get('IsPersonalBest', False)
                        ))
                        lap_count += 1
                        
                    except Exception as e:
                        print(f"    ⚠️ Error inserting lap {lap['LapNumber']}: {str(e)[:100]}...")
                        continue
                        
        except Exception as e:
            print(f"❌ Error processing laps for driver {driver_number}: {e}")
            raise
            
        return lap_count
    
    def process_sample_session(self):
        """Process a sample F1 session with improved error handling"""
        try:
            print("\n🔄 Processing real F1 session data...")
            print("🔄 Processing sample session...")
            
            # Load a sample session
            print("📡 Loading 2023 Bahrain GP Practice 1 session...")
            session = fastf1.get_session(2023, 'Bahrain', 'FP1')
            session.load()
            
            print(f"✅ Session loaded: {session.event['EventName']} - {session.name}")
            print(f"📊 Drivers in session: {len(session.drivers)}")
            
            # Process in transaction
            with self.get_db_connection() as conn:
                try:
                    # Create session record first
                    session_id = self.create_session_record(
                        conn, 2023, 2, 'FP1', 'Bahrain Grand Prix'
                    )
                    print(f"📊 Session stored with ID: {session_id}")
                    
                    # Process each driver separately to prevent cascade failures
                    print("👥 Creating teams and drivers...")
                    drivers_processed = 0
                    total_laps_processed = 0
                    
                    for driver_number in session.drivers:
                        try:
                            # Start a savepoint for each driver
                            with conn.cursor() as cur:
                                cur.execute("SAVEPOINT driver_processing")
                            
                            try:
                                driver_info = session.get_driver(driver_number)
                                team_name = driver_info.get('TeamName', 'Unknown Team')
                                
                                # Create team
                                team_id = self.create_or_update_team(conn, team_name, driver_info, 2023)
                                
                                # Create driver
                                self.create_or_update_driver(conn, driver_number, session, team_id)
                                
                                # Get driver laps
                                driver_laps = session.laps.pick_driver(driver_number)
                                
                                # Process lap times
                                lap_count = self.process_lap_times(conn, session_id, driver_number, driver_laps)
                                
                                print(f"  ✅ Driver {driver_number}: {lap_count} laps processed")
                                drivers_processed += 1
                                total_laps_processed += lap_count
                                
                                # Release savepoint
                                with conn.cursor() as cur:
                                    cur.execute("RELEASE SAVEPOINT driver_processing")
                                    
                            except Exception as e:
                                # Rollback to savepoint
                                with conn.cursor() as cur:
                                    cur.execute("ROLLBACK TO SAVEPOINT driver_processing")
                                print(f"  ❌ Error processing driver {driver_number}: {e}")
                                continue
                                
                        except Exception as e:
                            print(f"  ❌ Failed to set up driver {driver_number}: {e}")
                            continue
                    
                    # Commit the entire transaction
                    conn.commit()
                    print("✅ All teams and drivers created")
                    
                    print("✅ Session processing complete!")
                    print(f"📊 Summary:")
                    print(f"   - Drivers processed: {drivers_processed}/{len(session.drivers)}")
                    print(f"   - Total laps processed: {total_laps_processed}")
                    print(f"   - Session ID: {session_id}")
                    
                except Exception as e:
                    conn.rollback()
                    print(f"❌ Transaction failed: {e}")
                    raise
            
            return True
            
        except Exception as e:
            print(f"❌ Error processing sample session: {e}")
            return False

    def verify_data(self):
        """Verify that data was loaded correctly"""
        try:
            print("\n🔍 Verifying loaded data...")
            
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                    # Check teams
                    cur.execute("SELECT COUNT(*) as count FROM teams WHERE year = 2023")
                    team_count = cur.fetchone()['count']
                    print(f"📊 Teams (2023): {team_count}")
                    
                    # Check drivers
                    cur.execute("SELECT COUNT(*) as count FROM drivers WHERE is_active = true")
                    driver_count = cur.fetchone()['count']
                    print(f"🏎️ Active drivers: {driver_count}")
                    
                    # Check sessions
                    cur.execute("SELECT COUNT(*) as count FROM f1_sessions WHERE year = 2023")
                    session_count_2023 = cur.fetchone()['count']
                    print(f"🏁 2023 sessions: {session_count_2023}")
                    
                    cur.execute("SELECT COUNT(*) as count FROM f1_sessions WHERE year = 2025")
                    session_count_2025 = cur.fetchone()['count']
                    print(f"🏁 2025 sessions: {session_count_2025}")
                    
                    # Check lap times
                    cur.execute("SELECT COUNT(*) as count FROM lap_times")
                    lap_count = cur.fetchone()['count']
                    print(f"⏱️ Total lap times: {lap_count}")
                    
                    # Show top drivers by lap count
                    cur.execute("""
                        SELECT 
                            d.full_name, 
                            t.team_name, 
                            COUNT(lt.id) as lap_count
                        FROM drivers d
                        LEFT JOIN teams t ON d.team_id = t.id
                        LEFT JOIN lap_times lt ON d.driver_number = lt.driver_number
                        WHERE d.is_active = true
                        GROUP BY d.driver_number, d.full_name, t.team_name
                        ORDER BY lap_count DESC
                        LIMIT 5
                    """)
                    
                    top_drivers = cur.fetchall()
                    print("\n🏆 Top 5 drivers by lap count:")
                    for driver in top_drivers:
                        print(f"   {driver['full_name']} ({driver['team_name']}): {driver['lap_count']} laps")
                        
        except Exception as e:
            print(f"❌ Error verifying data: {e}")

    def run(self):
        """Main execution method"""
        print("🏁 F1 Data Processor Starting...")
        print("🎯 Processing REAL Formula 1 data for your dashboard!")
        
        # Test connections
        print("\n🔗 Testing connections...")
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT version()")
                    print("✅ Database connection successful")
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return False
        
        # Test and fix database schema
        try:
            self.test_database_schema()
        except Exception as e:
            print(f"❌ Schema test failed: {e}")
            return False
        
        # Process sample data
        if not self.process_sample_session():
            return False
            
        # Verify data
        self.verify_data()
        
        print("\n" + "="*60)
        print("🎉 F1 Data Processor completed successfully!")
        print("🎯 Your database now contains REAL Formula 1 data:")
        print("\n📊 Available data:")
        print("   ✅ 2023 Bahrain GP Practice 1 session (REAL DATA)")
        print("   ✅ Real F1 drivers with authentic team information")
        print("   ✅ Actual lap times and sector times from the session")
        print("   ✅ Real team colors and driver details")
        print("\n🌐 Your F1 dashboard is now powered by authentic Formula 1 data!")
        print("🔗 Visit http://localhost:3001/dashboard to see real F1 data")
        print("   - Select Year: 2023")
        print("   - Select Round: 2 (Bahrain)")
        print("   - Select Session: FP1")
        print("\n🚀 Next steps:")
        print("   - Your backend will now serve real F1 data instead of samples")
        print("   - Dashboard will show actual driver names and lap times")
        print("   - You can add more sessions by running this processor again")
        print("="*60)
        
        return True

if __name__ == "__main__":
    processor = F1DataProcessor()
    success = processor.run()
    sys.exit(0 if success else 1)