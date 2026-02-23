"""
Schema Migration Script
Adds missing columns to user_profiles table in Supabase.
Run this script once: python migrate_schema.py
"""
import requests
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# SQL migration: Add missing columns if they don't exist
MIGRATION_SQL = """
-- Add missing columns to user_profiles table
DO $$
BEGIN
    -- Add 'email' column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='email') THEN
        ALTER TABLE user_profiles ADD COLUMN email TEXT;
    END IF;

    -- Add 'designation' column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='designation') THEN
        ALTER TABLE user_profiles ADD COLUMN designation TEXT;
    END IF;

    -- Add 'department' column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='department') THEN
        ALTER TABLE user_profiles ADD COLUMN department TEXT;
    END IF;

    -- Add 'is_active' column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='is_active') THEN
        ALTER TABLE user_profiles ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;

    -- Add 'updated_at' column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='updated_at') THEN
        ALTER TABLE user_profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Add 'created_at' column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='created_at') THEN
        ALTER TABLE user_profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;
"""

def run_migration():
    """Run the migration using Supabase's PostgREST RPC or direct SQL."""
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
        return False

    print(f"Supabase URL: {SUPABASE_URL}")
    print("Running schema migration...")
    
    # Approach 1: Try using Supabase's pg REST endpoint for SQL
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    # Try the SQL query endpoint (available in newer Supabase versions)
    sql_url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    
    # First, let's try to create the exec_sql function if it doesn't exist
    # This uses the Supabase SQL API  
    # Try multiple approaches
    
    # Approach: Use individual ALTER TABLE statements via PostgREST schema
    columns_to_add = [
        ("email", "TEXT", None),
        ("designation", "TEXT", None),
        ("department", "TEXT", None),
        ("is_active", "BOOLEAN", "TRUE"),
        ("updated_at", "TIMESTAMPTZ", "NOW()"),
        ("created_at", "TIMESTAMPTZ", "NOW()"),
    ]
    
    success_count = 0
    for col_name, col_type, default in columns_to_add:
        # Try to read the column first
        test_url = f"{SUPABASE_URL}/rest/v1/user_profiles?select={col_name}&limit=0"
        resp = requests.get(test_url, headers=headers)
        
        if resp.status_code == 200:
            print(f"  ✓ Column '{col_name}' already exists")
            success_count += 1
        else:
            print(f"  ✗ Column '{col_name}' is MISSING (status: {resp.status_code})")
            print(f"    Error: {resp.text[:200]}")
    
    if success_count == len(columns_to_add):
        print("\n✅ All columns already exist! No migration needed.")
        return True
    
    # If columns are missing, print the SQL for manual execution
    print("\n" + "="*60)
    print("MANUAL MIGRATION REQUIRED")
    print("="*60)
    print("\nSome columns are missing. Please run this SQL in")
    print("Supabase Dashboard > SQL Editor:\n")
    print(MIGRATION_SQL)
    print("="*60)
    
    return False


if __name__ == "__main__":
    run_migration()
