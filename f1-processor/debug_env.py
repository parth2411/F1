import os
from dotenv import load_dotenv

print("=== Environment Debug ===")
load_dotenv()

print(f"DATABASE_URL: {os.getenv('DATABASE_URL')}")
print(f"DB_HOST: {os.getenv('DB_HOST')}")
print(f"DB_PORT: {os.getenv('DB_PORT')}")
print(f"DB_USER: {os.getenv('DB_USER')}")
print(f"DB_PASSWORD: {os.getenv('DB_PASSWORD')}")
print(f"DB_NAME: {os.getenv('DB_NAME')}")

# Test direct connection
import psycopg2

configs_to_test = [
    # Using environment variables
    {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', '5433'),
        'database': os.getenv('DB_NAME', 'f1_dashboard'),
        'user': os.getenv('DB_USER', 'f1_user'),
        'password': os.getenv('DB_PASSWORD', 'f1_password')
    },
    # Using IPv4 explicitly
    {
        'host': '127.0.0.1',
        'port': '5433',
        'database': 'f1_dashboard',
        'user': 'f1_user',
        'password': 'f1_password'
    }
]

for i, config in enumerate(configs_to_test, 1):
    print(f"\n--- Test {i} ---")
    print(f"Trying: {config['user']}@{config['host']}:{config['port']}/{config['database']}")
    try:
        conn = psycopg2.connect(**config)
        cur = conn.cursor()
        cur.execute("SELECT current_database(), current_user;")
        result = cur.fetchone()
        print(f"✅ SUCCESS! Database: {result[0]}, User: {result[1]}")
        conn.close()
        break
    except Exception as e:
        print(f"❌ FAILED: {e}")
