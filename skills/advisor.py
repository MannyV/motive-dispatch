import os
import asyncio
import json
from datetime import datetime
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from supabase import Client

class AdvisorSkill:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
        
        # Configure Gemini
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Load inventory
        with open("inventory.json", "r") as f:
            self.inventory = json.load(f)

    def identify_client(self, user_handle: str):
        """Finds or creates a client based on their handle."""
        response = self.supabase.table("clients").select("*").eq("phone_handle", user_handle).execute()
        
        if response.data:
            return response.data[0]
        else:
            # Create new client if not found
            new_client = {
                "name": f"User_{user_handle}", # Placeholder name
                "phone_handle": user_handle,
                "vibe_tags": [],
                "history_summary": "New client detected via Telegram."
            }
            res = self.supabase.table("clients").insert(new_client).execute()
            return res.data[0]

    async def extract_intent(self, message_content: str):
        """Uses Gemini to parse entities and vibe tags."""
        prompt = f"""
        You are a travel assistant. Extract the following from the message:
        - destination (City, Country)
        - hotel_name (if mentioned)
        - vibe_tags (list of adjectives describing the request, e.g. 'Eco-Chic', 'Luxury', 'Budget')
        
        Message: "{message_content}"
        
        Return ONLY valid JSON. Do not include markdown formatting like ```json.
        """
        
        try:
            # Async generation
            response = await self.model.generate_content_async(prompt)
            content = response.text
            
            # Cleanup json string if needed
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.replace("```", "").strip()
                
            return json.loads(content)
        except Exception as e:
            print(f"Error extracting intent: {e}")
            return {"destination": "Unknown", "vibe_tags": []}

    def enrich_trip(self, extracted_data):
        """Cross-references extracted tags with local inventory."""
        hotel_name = extracted_data.get("hotel_name")
        vibe_tags = extracted_data.get("vibe_tags", [])
        
        matches = []
        
        # Simple string matching for demo purposes
        if hotel_name:
            for item in self.inventory:
                if hotel_name.lower() in item["name"].lower():
                    matches.append(item)
        
        # If no direct match, try matching tags (naive recommendation)
        if not matches and vibe_tags:
             for item in self.inventory:
                # Check for intersection of tags
                common_tags = set(map(str.lower, vibe_tags)) & set(map(str.lower, item.get("vibe_tags", [])))
                if common_tags:
                    matches.append(item)

        return matches
    
    def save_trip_draft(self, client_id, extracted_data, enriched_matches):
        """Saves the structured data into Supabase trips table."""
        
        trip_data = {
            "client_id": client_id,
            "status": "draft",
            "destination": extracted_data.get("destination"),
            "detected_entities": {
                "extracted": extracted_data,
                "inventory_matches": enriched_matches
            }
        }
        
        result = self.supabase.table("trips").insert(trip_data).execute()
        return result.data

    async def handle(self, message):
        """Main handler for the skill."""
        user_handle = message.get("user_handle") 
        text = message.get("text")
        
        # 1. Identify Client
        client = self.identify_client(user_handle)
        print(f"Identified Client: {client['id']}")
        
        # 2. Extract Intent
        intent = await self.extract_intent(text)
        print(f"Extracted Intent: {intent}")
        
        # 3. Enrichment
        matches = self.enrich_trip(intent)
        print(f"Enriched Matches: {len(matches)} found")
        
        # 4. Action
        saved_trip = self.save_trip_draft(client['id'], intent, matches)
        print(f"Saved Trip Draft: {saved_trip[0]['id']}")
        
        return f"Trip draft created for {intent.get('destination')}! Found {len(matches)} matching options."
