import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


def check_database():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("Checking 'clients' table schema...")
    
    try:
        # Try selecting the 'facts' column. If it doesn't exist, this should fail.
        response = supabase.table("clients").select("facts").limit(1).execute()
        print("SUCCESS: 'facts' column exists.")
    except Exception as e:
        print(f"FAILURE: Could not access 'facts' column. Error: {e}")
        print("\nLikely Cause: Did you run the migration SQL?")
        print("ALTER TABLE clients ADD COLUMN facts jsonb DEFAULT '{}'::jsonb;")

if __name__ == "__main__":
    check_database()
