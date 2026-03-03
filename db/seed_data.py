# Seed data preparation script
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

STATUSES = ['lead', 'proposal', 'planning', 'closed']

def seed():
    print("Seeding 12 VIP Clients...")

    # 0. Cleanup
    print("Clearing existing data...")
    supabase.table("clients").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    
    for i, name in enumerate(CLIENT_NAMES):
        # 1. Create Client
        status = STATUSES[i % len(STATUSES)] # Cycle through statuses
        vibes = random.sample(VIBES, k=random.randint(1, 3))
        
        # Contact Methods & Preference
        contact_opts = ["Instagram", "WhatsApp", "Email", "Phone"]
        possible_methods = {}
        
        if random.random() > 0.1:
            # Generate 1-3 methods with fake handles
            selected_methods = random.sample(contact_opts, k=random.randint(1, 3))
            for m in selected_methods:
                if m == "Instagram":
                    possible_methods[m] = f"@{name.replace(' ', '').lower()}"
                elif m == "WhatsApp":
                    possible_methods[m] = f"+1-555-01{random.randint(10, 99)}"
                elif m == "Email":
                    possible_methods[m] = f"{name.split(' ')[0].lower()}@example.com"
                elif m == "Phone":
                    possible_methods[m] = f"555-01{random.randint(10, 99)}"
            
            preferred = random.choice(list(possible_methods.keys()))
        else:
            preferred = None

        client_data = {
            "name": name,
            "status": status,
            "vibe_tags": vibes,
            "facts": {
                "budget": random.choice(["high", "mid", "low"]),
                "diet": random.choice(["vegan", "gluten-free", "none", "pescatarian"]),
                "notes": "VIP handling required.",
                "contact_info": possible_methods, # Changed from list to dict
                "preferred_contact": preferred
            },
            "created_at": (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
        }
        
        res = supabase.table("clients").insert(client_data).execute()
        client_id = res.data[0]['id']
        print(f"Created {name} ({status})")
        


if __name__ == "__main__":
    seed()
