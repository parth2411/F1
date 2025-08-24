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
    
    def process_sample_session(self):
        """Process a sample session for testing"""
        print("🏁 Processing sample F1 session...")
        
        try:
            # Load a recent session (2024 Saudi Arabia GP)
            session = fastf1.get_session(2024, 'Saudi Arabia', 'R')
            session.load()
            
            print(f"✅ Loaded session: {session.event['EventName']} - {session.name}")
            print(f"📊 Found {len(session.drivers)} drivers")
            
            # Process drivers and store in database
            with self.get_db_connection() as conn:
                session_id = self.create_session_record(
                    conn, 2024, session.event['RoundNumber'], 
                    'Race', session.event['EventName']
                )
                
                for driver_number in session.drivers:
                    driver_info = session.get_driver(driver_number)
                    self.store_driver_info(conn, driver_info, session.event['EventName'])
                
                conn.commit()
                print(f"✅ Successfully processed session {session_id}")
                
        except Exception as e:
            print(f"❌ Error processing session: {e}")
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
    
    def store_driver_info(self, conn, driver_info, event_name):
        """Store driver information in database"""
        try:
            driver_number = driver_info['DriverNumber']
            abbreviation = driver_info['Abbreviation']
            full_name = driver_info['FullName']
            
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
        
        # Process a sample session
        processor.process_sample_session()
        
        print("✅ F1 Data Processor completed successfully!")
        
    except Exception as e:
        print(f"❌ F1 Data Processor failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()