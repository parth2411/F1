#!/usr/bin/env python3
"""
Debug version to check environment variable loading
"""

import os
from dotenv import load_dotenv

def debug_environment():
    """Debug environment variables"""
    print("🔍 Debugging environment variables...")
    
    # Load .env file
    load_dotenv()
    print(f"✅ Loaded .env from: {os.getcwd()}/.env")
    
    # Check if .env file exists
    env_file = '.env'
    if os.path.exists(env_file):
        print(f"✅ .env file exists: {env_file}")
        with open(env_file, 'r') as f:
            print("📄 .env file contents:")
            for line in f:
                if 'PASSWORD' in line:
                    print(f"   {line.split('=')[0]}=***")  # Hide password
                else:
                    print(f"   {line.strip()}")
    else:
        print(f"❌ .env file not found: {env_file}")
    
    print("\n🔍 Environment variables after loading:")
    env_vars = [
        'DATABASE_URL', 'DB_HOST', 'DB_PORT', 'DB_NAME', 
        'DB_USER', 'DB_PASSWORD', 'REDIS_URL'
    ]
    
    for var in env_vars:
        value = os.getenv(var)
        if value and 'password' in var.lower():
            print(f"   {var}=***")
        else:
            print(f"   {var}={value}")
    
    # Test individual connection parameters
    print("\n🔗 Connection parameters that will be used:")
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        # Mask password in output
        masked_url = database_url
        if '@' in masked_url:
            parts = masked_url.split('@')
            user_pass = parts[0].split('//')[-1]
            if ':' in user_pass:
                user, _ = user_pass.split(':')
                masked_url = masked_url.replace(user_pass, f"{user}:***")
        print(f"   DATABASE_URL: {masked_url}")
    else:
        print("   Using individual DB config:")
        print(f"   Host: {os.getenv('DB_HOST', 'localhost')}")
        print(f"   Port: {os.getenv('DB_PORT', '5433')}")
        print(f"   Database: {os.getenv('DB_NAME', 'f1_dashboard')}")
        print(f"   User: {os.getenv('DB_USER', 'f1_user')}")
        print(f"   Password: ***")

if __name__ == "__main__":
    debug_environment()
    
    # Try connection test
    print("\n🔗 Testing actual database connection...")
    
    import psycopg2
    
    # Test with DATABASE_URL
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        try:
            conn = psycopg2.connect(database_url)
            print("✅ DATABASE_URL connection successful!")
            conn.close()
        except Exception as e:
            print(f"❌ DATABASE_URL connection failed: {e}")
    
    # Test with individual config
    try:
        db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', '5433')),
            'database': os.getenv('DB_NAME', 'f1_dashboard'),
            'user': os.getenv('DB_USER', 'f1_user'),
            'password': os.getenv('DB_PASSWORD', 'f1_password')
        }
        conn = psycopg2.connect(**db_config)
        print("✅ Individual config connection successful!")
        conn.close()
    except Exception as e:
        print(f"❌ Individual config connection failed: {e}")