import os
import random
import json
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)

LOCATIONS = [
    {
        "id": "14 Washington Square N, New York, NY",
        "access": "Rear Alley",
        "code": "#4592",
        "cues": ["Blue Door"]
    },
    {
        "id": "100 Broadway, New York, NY",
        "access": "Loading Dock",
        "code": "Keyfob Required",
        "cues": ["Next to green awning"]
    },
    {
        "id": "2500 Broadway, New York, NY",
        "access": "Delivery Room",
        "code": "See Guard",
        "cues": ["Glass rotating door"]
    }
]

def seed():
    print("Clearing existing locations from Motive Dispatch database...")
    supabase.table("motive_dispatch_intelligence").delete().neq("location_identifier", "nothing").execute()

    print("Seeding Motivation Dispatch database with initial locations...")
    
    for loc in LOCATIONS:
        record = {
            "location_identifier": loc["id"],
            "structured_data": {
                "access_point": loc["access"],
                "access_code": loc["code"],
                "visual_cues": loc["cues"]
            }
        }
        try:
            res = supabase.table("motive_dispatch_intelligence").insert(record).execute()
            print(f"Created intelligence for: {loc['id']}")
        except Exception as e:
            print(f"Failed to create {loc['id']}: {e}")

if __name__ == "__main__":
    seed()
