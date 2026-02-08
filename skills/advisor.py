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
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Load inventory
        with open("inventory.json", "r") as f:
            self.inventory = json.load(f)

    async def identify_client(self, client_name: str, advisor_handle: str):
        """Finds or creates a client based on extracted name, associated with advisor."""
        # Normalize name for search
        safe_name = client_name.strip()
        
        # Search for existing client by name (Simplified MVP logic)
        response = self.supabase.table("clients").select("*").ilike("name", f"%{safe_name}%").execute()
        
        if response.data:
            return response.data[0]
        else:
            # Create new client LEAD if not found
            new_client = {
                "name": safe_name,
                "phone_handle": f"client_{safe_name}_{advisor_handle}", # Mock handle linking to advisor
                "vibe_tags": [],
                "status": "lead",
                "history_summary": f"Lead captured via Sarah (@{advisor_handle})"
            }
            res = self.supabase.table("clients").insert(new_client).execute()
            return res.data[0]

    async def extract_intent(self, message_content: str, image_path: str = None, audio_path: str = None):
        """Uses Gemini to parse entities and vibe tags from text, image, or audio."""
        prompt_text = f"""
        You are an AI assistant for a travel advisor named Sarah.
        Extract the structured data from her message (and optional image/audio) about a client.
        
        Fields to extract:
        - client_name (Who is the client? e.g. 'Bella', 'John'. If not specified, use 'Unknown Client')
        - destination (City, Country. Use content if available)
        - hotel_name (if mentioned)
        - vibe_tags (list of adjectives describing the request, e.g. 'Eco-Chic', 'Luxury', 'Budget')
        - request_status (infer status: 'lead', 'proposal', 'negotiation', 'closed', 'booked'. Default to current status or 'lead' if new)
        - new_facts (Dictionary of general client facts. e.g. {{"children": 3, "diet": "vegan", "budget": "high"}})
        - user_intent (One of: ['inquiry', 'update_profile', 'trip_planning', 'unknown']. 'inquiry' is when the user asks a question about the client. 'update_profile' is adding facts. 'trip_planning' is asking for a trip.)
        
        Message: "{message_content}"
        """
        
        content_parts = [prompt_text]
        
        if image_path:
            import PIL.Image
            try:
                img = PIL.Image.open(image_path)
                content_parts.append(img)
                content_parts.append(" Analyze this image for travel details.")
            except Exception as e:
                print(f"Error loading image: {e}")

        if audio_path:
            try:
                # Upload audio to Gemini
                print(f"Uploading audio: {audio_path}")
                audio_file = genai.upload_file(path=audio_path)
                # Wait for processing? Usually fast for short clips.
                content_parts.append(audio_file)
                content_parts.append(" Analyze this voice note for travel details.")
            except Exception as e:
                print(f"Error loading audio: {e}")
        
        content_parts.append("Return ONLY valid JSON. Do not include markdown formatting like ```json.")
        
        try:
            # Async generation with strict JSON schema (Gemini 1.5 feature)
            # content_parts can contain text and images
            response = await self.model.generate_content_async(
                content_parts,
                generation_config={"response_mime_type": "application/json"}
            )
            content = response.text
            print(f"DEBUG: Raw Gemini response: {content}")
            
            # Cleanup json string if needed
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.replace("```", "").strip()
                
            return json.loads(content)
        except Exception as e:
            print(f"Error extracting intent: {e}")
        except Exception as e:
            print(f"Error extracting intent: {e}")
            return {"client_name": "Unknown", "destination": "Unknown", "vibe_tags": [], "new_facts": {}, "user_intent": "unknown"}

    async def answer_client_query(self, client_profile, question):
        """Uses Gemini to answer a natural language question about a client."""
        context = f"""
        Client Profile:
        Name: {client_profile.get('name')}
        Vibe Tags: {', '.join(client_profile.get('vibe_tags', []))}
        Facts: {json.dumps(client_profile.get('facts', {}))}
        History: {client_profile.get('history_summary')}
        """
        
        prompt = f"""
        You are meaningful travel advisor assistant.
        Answer the following question about the client based strictly on the profile usage.
        
        Context: {context}
        Question: {question}
        
        Answer naturally and helpful. Do NOT use bold formatting (**) or markdown in your response. Keep it clean text.
        """
        
        try:
             response = await self.model.generate_content_async(prompt)
             return response.text
        except Exception as e:
            return f"I couldn't generate an answer due to an error: {e}"

    async def update_client_profile(self, client_id, new_vibes, new_facts, new_status=None):
        """Updates client profile with new vibes, facts, and status."""
        
        # specific to supabase-py: fetching current tags/facts first is safest to append/merge
        current = self.supabase.table("clients").select("vibe_tags, facts").eq("id", client_id).execute()
        current_data = current.data[0]
        current_tags = current_data.get("vibe_tags") or []
        current_facts = current_data.get("facts") or {}
        
        # Append and deduplicate Vibes
        updated_tags = list(set(current_tags + new_vibes))
        
        # Merge Facts (New overwrites Old)
        updated_facts = {**current_facts, **new_facts}
        
        update_data = {
            "vibe_tags": updated_tags,
            "facts": updated_facts
        }
        if new_status:
            update_data["status"] = new_status
            
        self.supabase.table("clients").update(update_data).eq("id", client_id).execute()
        return updated_tags, updated_facts

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
    
    async def save_or_update_trip(self, client_id, extracted_data, enriched_matches):
        """Creates a new trip or updates an existing draft for the same destination."""
        destination = extracted_data.get("destination", "").split(",")[0].strip() # Simple normalization
        
        # 1. Check for existing draft for this client & destination
        # Note: In production you'd want smarter fuzzy matching or ID-based referencing
        existing = self.supabase.table("trips").select("*")\
            .eq("client_id", client_id)\
            .eq("status", "draft")\
            .ilike("destination", f"%{destination}%")\
            .execute()
            
        if existing.data:
            # UPDATE existing trip
            trip_id = existing.data[0]['id']
            # Merge logic could be complex. For now, we overwrite specifics but keep structure
            # Ideally we assume the new request adds to the old one.
            
            # Fetch old entities
            old_entities = existing.data[0].get('detected_entities', {})
            old_vibes = old_entities.get('extracted', {}).get('vibe_tags', [])
            new_vibes = extracted_data.get('vibe_tags', [])
            
            # Merge Vibes
            merged_vibes = list(set(old_vibes + new_vibes))
            extracted_data['vibe_tags'] = merged_vibes
            
            update_data = {
                "detected_entities": {
                    "extracted": extracted_data,
                    "inventory_matches": enriched_matches
                },
                "updated_at": "now()"
            }
            res = self.supabase.table("trips").update(update_data).eq("id", trip_id).execute()
            return res.data[0], "Updated"
        else:
            # CREATE new trip
            trip_data = {
                "client_id": client_id,
                "status": "draft",
                "destination": extracted_data.get("destination"),
                "detected_entities": {
                    "extracted": extracted_data,
                    "inventory_matches": enriched_matches
                }
            }
            res = self.supabase.table("trips").insert(trip_data).execute()
            return res.data[0], "Created"

    async def handle(self, message):
        """Main handler for the skill."""
        advisor_handle = message.get("user_handle") 
        text = message.get("text")
        image_path = message.get("image_path")
        audio_path = message.get("audio_path")
        
        # 1. Extract Intent (Who + What)
        intent = await self.extract_intent(text, image_path, audio_path)
        client_name = intent.get("client_name", "Unknown Client")
        request_status = intent.get("request_status", "active")
        print(f"Extracted: Client={client_name}, Intent={intent}")
        
        # 2. Identify Client (Find 'Bella' or create her)
        client = await self.identify_client(client_name, advisor_handle)
        print(f"Identified Client ID: {client['id']}")
        
        # 3. Update Profile (Add 'Brutalist' to Bella's tags, and 'children': 3 to facts)
        new_vibes = intent.get("vibe_tags", [])
        new_facts = intent.get("new_facts", {})
        
        updated_tags, updated_facts = await self.update_client_profile(client['id'], new_vibes, new_facts, request_status)
        print(f"Updated Client Profile: Vibes={updated_tags}, Facts={updated_facts}, Status={request_status}")

        # BRANCH: If User Intent is INQUIRY -> Answer Question
        if intent.get("user_intent") == "inquiry":
            answer = await self.answer_client_query(client, text)
            return f"🤖 **Atlas for {client_name}**:\n{answer}"

        # If there is NO destination, this is just a profile update
        destination = intent.get("destination")
        if not destination or destination == "Unknown":
            # Natural language confirmation
            return f"Got it. I've updated {client_name}'s profile with that information."

        # 4. Enrichment
        matches = self.enrich_trip(intent)
        print(f"Enriched Matches: {len(matches)} found")
        
        # 5. Action (Create or Update Trip Draft)
        saved_trip, action_type = await self.save_or_update_trip(client['id'], intent, matches)
        print(f"Trip {action_type}: {saved_trip['id']}")
        
        fact_msg = ""
        if new_facts:
             fact_msg = f"\n📝 **Added Facts**: {', '.join([f'{k}: {v}' for k,v in new_facts.items()])}"

        if matches:
            hotel_names = ", ".join([m["name"] for m in matches])
            return f"✅ **{client_name} Updated** (Status: {request_status}){fact_msg}\n➕ Vibe: {', '.join(new_vibes)}\n\n📝 **Draft {action_type}**: {destination}\nfound matches: {hotel_names}"
        else:
            return f"✅ **{client_name} Updated** (Status: {request_status}){fact_msg}\n➕ Vibe: {', '.join(new_vibes)}\n\n📝 **Draft {action_type}**: {destination}"
