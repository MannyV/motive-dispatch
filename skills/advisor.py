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
            
        # Conversation State: {user_handle: {"state": "waiting_for_x", "data": {...}}}
        self.user_sessions = {}

    async def identify_client(self, client_name: str, advisor_handle: str):
        """
        Finds a client based on extracted name.
        Returns: (client_data, status)
        Status: 'FOUND', 'NOT_FOUND', 'AMBIGUOUS'
        """
        if not client_name or client_name in ["Unknown", "None", "Unknown Client"]:
            return None, "Start"

        # Normalize name for search
        safe_name = client_name.strip()
        
        # Search for existing client by name
        response = self.supabase.table("clients").select("*").ilike("name", f"%{safe_name}%").execute()
        
        if response.data:
            if len(response.data) == 1:
                return response.data[0], "FOUND"
            else:
                return response.data, "AMBIGUOUS" # Return list of matches
        else:
            return None, "NOT_FOUND"

    async def create_client(self, client_name: str, advisor_handle: str, initial_data: dict = None):
        """Creates a new client."""
        new_client = {
            "name": client_name,
            "phone_handle": f"client_{client_name}_{advisor_handle}_{int(datetime.now().timestamp())}", 
            "vibe_tags": initial_data.get("vibe_tags", []) if initial_data else [],
            "facts": initial_data.get("new_facts", {}) if initial_data else {},
            "status": "lead",
            "history_summary": f"Lead captured via Sarah (@{advisor_handle})"
        }
        res = self.supabase.table("clients").insert(new_client).execute()
        return res.data[0]

    async def extract_intent(self, message_content: str, image_path: str = None, audio_path: str = None):
        """Uses Gemini to parse entities and vibe tags from text, image, or audio."""
        prompt_text = f"""
        You are Atlas, a Chief of Staff and AI assistant for a high-end travel advisor named Sarah.
        Your goal is to organize her client knowledge base and be helpful, conversational, and precise.
        
        Extract the structured data from her message (and optional image/audio) about a client.
        
        Fields to extract:
        - client_name (Who is the client? e.g. 'Bella', 'John'. If NOT specified/clear, use 'Unknown' or 'None')
        - destination (City, Country. Use content if available)
        - hotel_name (if mentioned)
        - vibe_tags (list of adjectives describing the request, e.g. 'Eco-Chic', 'Luxury', 'Budget')
        - request_status (infer status: 'lead', 'proposal', 'planning', 'closed', 'booked'. Default to 'lead')
        - new_facts (Dictionary of general client facts. e.g. {{"children": 3, "diet": "vegan", "budget": "high"}})
        - user_intent (One of: ['inquiry', 'update_profile', 'trip_planning', 'confirmation', 'negation', 'unknown']. 
           - 'inquiry': user asks a question about existing data. 
           - 'update_profile': user provides new info.
           - 'confirmation': user says "yes", "do it", "create it".
           - 'negation': user says "no", "cancel".
          )
        
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
        """Main handler for the skill with conversational logic."""
        advisor_handle = message.get("user_handle") 
        text = message.get("text")
        image_path = message.get("image_path")
        audio_path = message.get("audio_path")
        
        # 0. Check for Active Session (Waiting for user response)
        if advisor_handle in self.user_sessions:
            session = self.user_sessions[advisor_handle]
            state = session.get("state")
            data = session.get("data")
            
            if state == "confirm_create_client":
                # User is responding to "Should I create X?"
                # Simple check for simple replies. For complex, we might re-run extract_intent.
                if any(w in text.lower() for w in ["yes", "yeah", "sure", "do it", "create", "ok"]):
                    # Create the client
                    pending_client = data.get("client_name")
                    initial_intent = data.get("intent")
                    
                    new_client = await self.create_client(pending_client, advisor_handle, initial_intent)
                    del self.user_sessions[advisor_handle] # Clear session
                    
                    return f"✅ **Profile Created**: I've added {pending_client} to your client list as a Lead.\nWhat would you like to add for them?"
                
                elif any(w in text.lower() for w in ["no", "nope", "cancel", "wrong"]):
                    del self.user_sessions[advisor_handle]
                    return "Understood. I won't create the profile. Let me know if you need anything else."
                
                # If ambiguous response, fall through to normal processing (maybe they changed topic)
        
        # 1. Extract Intent (Who + What)
        intent = await self.extract_intent(text, image_path, audio_path)
        client_name = intent.get("client_name")
        user_intent = intent.get("user_intent")

        print(f"Extracted: Client={client_name}, Intent={intent}")
        
        # 2. Identify Client
        client_data, status = await self.identify_client(client_name, advisor_handle)
        
        # --- LOGIC BRANCHES ---
        
        # CASE A: Client NOT FOUND -> Ask to Create
        if status == "NOT_FOUND":
            if client_name and client_name not in ["Unknown", "None"]:
                # Store intent in session and ask confirmation
                self.user_sessions[advisor_handle] = {
                    "state": "confirm_create_client",
                    "data": {"client_name": client_name, "intent": intent}
                }
                return f"🧐 I don't see a profile for **{client_name}**. Should I create a new client profile for them?"
            else:
                return "I'm listening. Could you specify which client you're referring to?"

        # CASE B: Client AMBIGUOUS -> Ask to Clarify (MVP: Just pick first or ask)
        if status == "AMBIGUOUS":
            # list names
            names = [c['name'] for c in client_data]
            return f"🤔 I found multiple clients matching '{client_name}': {', '.join(names)}. Could you be more specific?"

        # CASE C: Client FOUND -> Process Update
        if status == "FOUND":
            client = client_data
            
             # BRANCH: If User Intent is INQUIRY -> Answer Question
            if user_intent == "inquiry":
                answer = await self.answer_client_query(client, text)
                return f"🤖 **Atlas for {client['name']}**:\n{answer}"
            
            # Update Profile
            new_vibes = intent.get("vibe_tags", [])
            new_facts = intent.get("new_facts", {})
            request_status = intent.get("request_status", client.get("status")) # Default to existing
            
            updated_tags, updated_facts = await self.update_client_profile(client['id'], new_vibes, new_facts, request_status)
            
            # Trip Enrichment
            destination = intent.get("destination")
            matches = []   
            if destination and destination != "Unknown":
                matches = self.enrich_trip(intent)
                saved_trip, action_type = await self.save_or_update_trip(client['id'], intent, matches)
                
                hotel_msg = ""
                if matches:
                    hotel_msg = f"\n🏨 Matches: {', '.join([m['name'] for m in matches])}"
                
                return f"✅ **Atlas Update**: Updated **{client['name']}**.\n📝 Drafted trip to **{destination}**.{hotel_msg}"
            
            # Just Profile Update
            updates = []
            if new_vibes: updates.append(f"Vibes: {', '.join(new_vibes)}")
            if new_facts: updates.append(f"Facts: {len(new_facts)} added")
            
            msg = f"✅ **Atlas Update**: Saved info for **{client['name']}**."
            if updates:
                msg += f"\n({', '.join(updates)})"
            return msg

        return "I'm here. Tell me about a client or a trip."
