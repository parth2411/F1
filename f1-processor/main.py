#!/usr/bin/env python3
"""
Fixed F1 Data Processor - Database Connection Issues Resolved
"""

import os
import sys
import json
import psycopg2
import psycopg2.extras
import redis
import fastf1
import pandas as pd
import numpy as np
from datetime import datetime, timezone
from contextlib import contextmanager
import logging
from dotenv import load_dotenv

class F1DataProcessor:
    def __init__(self):
        # Load environment variables first
        load_dotenv()
        
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
        cache_dir = os.getenv('FASTF1_CACHE_DIR', './cache')
        os.makedirs(cache_dir, exist_ok=True)
        fastf1.Cache.enable_cache(cache_dir)
        print(f"✅ FastF1 cache directory: {cache_dir}")
        
    def setup_connections(self):
        """Set up database and Redis connections"""
        # Try DATABASE_URL first, then fall back to individual env vars
        database_url = os.getenv('DATABASE_URL')
        
        if database_url:
            # Parse DATABASE_URL (format: postgresql://user:pass@host:port/dbname)
            print(f"🔗 Using DATABASE_URL: {database_url.replace(os.getenv('DB_PASSWORD', ''), '***')}")
            try:
                self.db_conn_str = database_url
                # Test connection
                test_conn = psycopg2.connect(database_url)
                test_conn.close()
                print("✅ Database connection successful via DATABASE_URL")
            except Exception as e:
                print(f"❌ DATABASE_URL connection failed: {e}")
                # Fall back to individual config
                self.setup_individual_db_config()
        else:
            self.setup_individual_db_config()
        
        # Redis connection with correct port
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6380')  # Fixed port
        try:
            self.redis_client = redis.from_url(redis_url)
            self.redis_client.ping()
            print(f"✅ Redis connection successful: {redis_url}")
        except Exception as e:
            print(f"❌ Redis connection failed: {e}")
            print(f"🔍 Tried connecting to: {redis_url}")
            self.redis_client = None
    
    def setup_individual_db_config(self):
        """Set up database config using individual environment variables"""
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', '5433')),  # Correct port for Docker
            'database': os.getenv('DB_NAME', 'f1_dashboard'),
            'user': os.getenv('DB_USER', 'f1_user'),
            'password': os.getenv('DB_PASSWORD', 'f1_password')
        }
        
        try:
            # Test connection with individual config
            test_conn = psycopg2.connect(**self.db_config)
            test_conn.close()
            print(f"✅ Database connection successful: {self.db_config['host']}:{self.db_config['port']}")
            self.db_conn_str = None  # Use db_config instead
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            print(f"🔍 Tried connecting to: {self.db_config}")
            raise
            
    @contextmanager
    def get_db_connection(self):
        """Get database connection with proper error handling"""
        conn = None
        try:
            if hasattr(self, 'db_conn_str') and self.db_conn_str:
                conn = psycopg2.connect(self.db_conn_str)
            else:
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
                
    def test_database_connection(self):
        """Test database connection and schema"""
        print("🔍 Testing database connection...")
        
        try:
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                    # Test basic connection
                    cur.execute("SELECT current_user, current_database(), version();")
                    result = cur.fetchone()
                    print(f"✅ Connected as: {result['current_user']}")
                    print(f"✅ Database: {result['current_database']}")
                    
                    # Check tables exist
                    cur.execute("""
                        SELECT table_name 
                        FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        ORDER BY table_name;
                    """)
                    tables = cur.fetchall()
                    print(f"✅ Found {len(tables)} tables:")
                    for table in tables:
                        print(f"   - {table['table_name']}")
                        
        except Exception as e:
            print(f"❌ Database connection test failed: {e}")
            raise
    
    def process_multiple_sessions(self):
        """Process multiple F1 sessions including 2025 data"""
        print("🏁 Processing multiple F1 sessions...")
        
        # Sessions to process (both 2024 and 2025)
        sessions_to_process = [
            # 2024 sessions
            (2024, 'Saudi Arabia', 'R'),
            (2024, 'Bahrain', 'R'),
            (2024, 'Australia', 'R'),
            (2024, 'Japan', 'R'),
            (2024, 'China', 'R'),
            
            # 2025 sessions (if available)
            (2025, 'Bahrain', 'R'),
            (2025, 'Saudi Arabia', 'R'),
            (2025, 'Australia', 'R'),
            (2025, 'Japan', 'R'),
            (2025, 'China', 'R'),
        ]
        
        processed_count = 0
        failed_count = 0
        
        for year, location, session_type in sessions_to_process:
            try:
                print(f"\n🔄 Processing {year} {location} {session_type}...")
                
                # Try to load the session
                session = fastf1.get_session(year, location, session_type)
                session.load()
                
                print(f"✅ Loaded session: {session.event['EventName']} - {session.name}")
                print(f"📊 Found {len(session.drivers)} drivers")
                
                # Process and store in database
                with self.get_db_connection() as conn:
                    # Convert numpy types from session event data
                    session_year = self.convert_numpy_types(year)
                    round_number = self.convert_numpy_types(session.event['RoundNumber'])
                    event_name = str(session.event['EventName'])
                    
                    session_id = self.create_session_record(
                        conn, session_year, round_number, 
                        session_type, event_name
                    )
                    
                    # Store drivers
                    for driver_number in session.drivers:
                        driver_info = session.get_driver(driver_number)
                        self.store_driver_info(conn, driver_info, event_name)
                    
                    # Store some lap times (sample)
                    self.store_sample_lap_times(conn, session_id, session)
                    
                    conn.commit()
                    print(f"✅ Successfully processed session {session_id}")
                    processed_count += 1
                    
            except Exception as e:
                print(f"❌ Failed to process {year} {location} {session_type}: {e}")
                failed_count += 1
                continue
        
        print(f"\n📊 Processing Summary:")
        print(f"✅ Successfully processed: {processed_count} sessions")
        print(f"❌ Failed to process: {failed_count} sessions")
        
        return processed_count > 0

    def store_sample_lap_times(self, conn, session_id, session):
        """Store sample lap times for the session"""
        try:
            print(f"💾 Storing lap times for session {session_id}...")
            
            # Get laps data for first few drivers
            sample_drivers = list(session.drivers)[:5]  # Process first 5 drivers
            
            for driver_number in sample_drivers:
                try:
                    driver_laps = session.laps.pick_driver(driver_number)
                    
                    if len(driver_laps) == 0:
                        continue
                        
                    # Store first 10 laps for each driver
                    for i, lap in driver_laps.head(10).iterrows():
                        lap_time = self.convert_numpy_types(lap.get('LapTime', None))
                        lap_number = self.convert_numpy_types(lap.get('LapNumber', i + 1))
                        
                        # Convert timedelta to seconds if present
                        if lap_time and hasattr(lap_time, 'total_seconds'):
                            lap_time = lap_time.total_seconds()
                        elif lap_time and str(lap_time) != 'nan':
                            lap_time = float(lap_time)
                        else:
                            lap_time = None
                        
                        with conn.cursor() as cur:
                            cur.execute("""
                                INSERT INTO lap_times (
                                    session_id, driver_number, lap_number, lap_time,
                                    sector1_time, sector2_time, sector3_time,
                                    compound, tyre_life, position
                                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                                ON CONFLICT (session_id, driver_number, lap_number) 
                                DO UPDATE SET
                                    lap_time = EXCLUDED.lap_time,
                                    sector1_time = EXCLUDED.sector1_time,
                                    sector2_time = EXCLUDED.sector2_time,
                                    sector3_time = EXCLUDED.sector3_time,
                                    compound = EXCLUDED.compound,
                                    tyre_life = EXCLUDED.tyre_life,
                                    position = EXCLUDED.position
                            """, (
                                session_id,
                                str(driver_number),
                                lap_number,
                                lap_time,
                                None,  # sector times - would need additional processing
                                None,
                                None,
                                str(lap.get('Compound', 'UNKNOWN'))[:10] if lap.get('Compound') else None,
                                self.convert_numpy_types(lap.get('TyreLife', None)),
                                self.convert_numpy_types(lap.get('Position', None))
                            ))
                            
                except Exception as driver_error:
                    print(f"⚠️ Could not process laps for driver {driver_number}: {driver_error}")
                    continue
            
            print(f"✅ Stored lap times for {len(sample_drivers)} drivers")
            
        except Exception as e:
            print(f"❌ Error storing lap times: {e}")

    def get_available_sessions(self, year):
        """Get list of available sessions for a year"""
        try:
            print(f"🔍 Checking available sessions for {year}...")
            
            # Common F1 locations that usually have races
            common_locations = [
                'Bahrain', 'Saudi Arabia', 'Australia', 'Japan', 'China',
                'Miami', 'Italy', 'Monaco', 'Spain', 'Canada', 
                'Austria', 'Great Britain', 'Hungary', 'Belgium',
                'Netherlands', 'Singapore', 'United States', 'Mexico',
                'Brazil', 'Las Vegas', 'Qatar', 'Abu Dhabi'
            ]
            
            available_sessions = []
            
            for location in common_locations[:10]:  # Check first 10 to avoid too many requests
                try:
                    # Try to get session info (this will fail if not available)
                    session = fastf1.get_session(year, location, 'R')
                    
                    # This will raise an exception if no data available
                    session_info = session.event
                    
                    available_sessions.append({
                        'location': location,
                        'event_name': session_info.get('EventName', location),
                        'round': session_info.get('RoundNumber', 0)
                    })
                    print(f"✅ Found: {location}")
                    
                except Exception:
                    # Session not available - skip
                    continue
            
            print(f"📊 Found {len(available_sessions)} available sessions for {year}")
            return available_sessions
            
        except Exception as e:
            print(f"❌ Error checking available sessions: {e}")
            return []
    
    def create_session_record(self, conn, year, round_number, session_type, event_name):
        """Create session record and return session ID"""
        try:
            # Convert numpy types to Python types
            year = self.convert_numpy_types(year)
            round_number = self.convert_numpy_types(round_number)
            
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
    
    def convert_numpy_types(self, value):
        """Convert numpy types to Python native types"""
        import numpy as np
        
        if isinstance(value, np.integer):
            return int(value)
        elif isinstance(value, np.floating):
            return float(value)
        elif isinstance(value, np.ndarray):
            return value.tolist()
        elif hasattr(value, 'item'):  # For numpy scalars
            return value.item()
        else:
            return value
    
    def store_driver_info(self, conn, driver_info, event_name):
        """Store driver information in database"""
        try:
            # Convert numpy types to Python types
            driver_number = self.convert_numpy_types(driver_info['DriverNumber'])
            abbreviation = str(driver_info['Abbreviation'])
            full_name = str(driver_info['FullName'])
            
            # Split full name into first and last
            name_parts = full_name.split(' ', 1)
            first_name = name_parts[0] if len(name_parts) > 0 else ''
            last_name = name_parts[1] if len(name_parts) > 1 else ''
            
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                # Insert or update driver
                cur.execute("""
                    INSERT INTO drivers (driver_number, driver_code, full_name, first_name, last_name, is_active)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (driver_number) DO UPDATE SET
                        driver_code = EXCLUDED.driver_code,
                        full_name = EXCLUDED.full_name,
                        first_name = EXCLUDED.first_name,
                        last_name = EXCLUDED.last_name,
                        is_active = EXCLUDED.is_active
                """, (
                    str(driver_number), 
                    abbreviation, 
                    full_name, 
                    first_name, 
                    last_name, 
                    True
                ))
                
                print(f"✅ Driver: {driver_number} - {full_name}")
                
        except Exception as e:
            print(f"❌ Error with driver {driver_number}: {e}")
            raise

def main():
    """Main function"""
    print("🏁 F1 Data Processor Starting...")
    print("🎯 Processing REAL Formula 1 data for your dashboard!")
    print("🔗 Testing connections...")
    
    try:
        # Initialize processor
        processor = F1DataProcessor()
        
        # Test database connection
        processor.test_database_connection()
        
        # Check what sessions are available for 2025
        available_2025 = processor.get_available_sessions(2025)
        print(f"\n📅 2025 Sessions Available: {len(available_2025)}")
        for session in available_2025:
            print(f"   - {session['event_name']} (Round {session['round']})")
        
        # Process multiple sessions (2024 and 2025)
        success = processor.process_multiple_sessions()
        
        if success:
            print("\n✅ F1 Data Processor completed successfully!")
            print("🌐 Your F1 dashboard now has fresh data!")
            print("💡 Start your backend server to see the data on your frontend!")
        else:
            print("\n⚠️  No sessions were processed successfully")
            print("💡 This might be because 2025 season data isn't available yet")
        
    except Exception as e:
        print(f"❌ F1 Data Processor failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()