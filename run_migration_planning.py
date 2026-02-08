import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL or SUPABASE_KEY not set.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Running migration...")

try:
    with open('db/migrate_planning.sql', 'r') as f:
        sql = f.read()
    
    # We can try to use the 'run_sql' RPC if it exists, or individual statements if supported.
    # Since we set up `run_sql` previously, let's use it.
    response = supabase.rpc('run_sql', {'sql_query': sql}).execute()
    print("Migration successful:", response)
except Exception as e:
    print(f"Migration failed: {e}")
    # Fallback: Print instructions if RPC fails
    print("\nIf 'run_sql' RPC is missing, please run the SQL manually in Supabase Dashboard:")
    print(sql)
