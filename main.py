import os
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client
from gateway import Gateway

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

if not all([SUPABASE_URL, SUPABASE_KEY, TELEGRAM_TOKEN]):
    print("Error: Missing environment variables. Please check .env file.")
    exit(1)


def main():
    print("Starting Fora Atlas MVP (OpenClaw Clone)...")
    
    # Initialize Supabase Client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Initialize Gateway with Supabase client (passed to Router)
    gateway = Gateway(telegram_token=TELEGRAM_TOKEN, supabase_client=supabase)
    
    # Start Listening (Blocking call)
    gateway.run()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nShutting down...")
