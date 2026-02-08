import os
import random
import json
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)

CLIENT_NAMES = [
    "Emily Johnson", "Michael Williams", "Sarah Brown", "David Jones",
    "Jessica Garcia", "James Miller", "Jennifer Davis", "Robert Rodriguez",
    "Lisa Martinez", "William Hernandez", "Elizabeth Lopez", "John Smith"
]

VIBES = ["Eco-Chic", "Brutalist", "Ultra-Luxury", "Off-the-Grid", "Wellness", "Adventure", "Family", "Art-Focused", "Culinary"]

DESTINATIONS = [
    "Aman Tokyo, Japan", "Singita Lebombo, South Africa", "Amangiri, Utah", 
    "Hotel Esencia, Tulum", "Claridge's, London", "Cheval Blanc, Paris",
    "Nihi Sumba, Indonesia", "Fogo Island Inn, Canada", "Deplar Farm, Iceland",
    "Royal Mansour, Marrakech", "Post Ranch Inn, Big Sur", "Villa d'Este, Lake Como"
]

STATUSES = ['lead', 'outreach', 'proposal', 'negotiation', 'closed']

def seed():
    print("Seeding 12 VIP Clients...")

    # 0. Cleanup
    print("Clearing existing data...")
    supabase.table("trips").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    supabase.table("clients").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    
    for i, name in enumerate(CLIENT_NAMES):
        # 1. Create Client
        status = STATUSES[i % len(STATUSES)] # Cycle through statuses
        vibes = random.sample(VIBES, k=random.randint(1, 3))
        
        client_data = {
            "name": name,
            "status": status,
            "vibe_tags": vibes,
            "facts": {
                "budget": random.choice(["high", "mid", "low"]),
                "diet": random.choice(["vegan", "gluten-free", "none", "pescatarian"]),
                "notes": "VIP handling required."
            },
            "created_at": (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
        }
        
        res = supabase.table("clients").insert(client_data).execute()
        client_id = res.data[0]['id']
        print(f"Created {name} ({status})")
        
        # 2. Add 1-3 Trips
        num_trips = random.randint(1, 3)
        for _ in range(num_trips):
            trip_dest = random.choice(DESTINATIONS)
            trip_status = "booked" if status == "closed" or random.random() > 0.7 else "draft"
            
            trip_data = {
                "client_id": client_id,
                "destination": trip_dest,
                "status": trip_status,
                "created_at": (datetime.now() - timedelta(days=random.randint(1, 20))).isoformat(),
                "detected_entities": {
                    "extracted": {
                        "hotel_name": trip_dest.split(",")[0],
                        "dates": "Spring 2026"
                    }
                }
            }
            supabase.table("trips").insert(trip_data).execute()
            print(f"  -> Added Trip: {trip_dest} ({trip_status})")

if __name__ == "__main__":
    seed()
