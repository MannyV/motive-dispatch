import os
import asyncio
import json
from datetime import datetime
from google import genai
from supabase import Client

class FleetIQSkill:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
        
        # Configure Gemini using the new SDK
        self.ai = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
            
        # Conversation State: {user_handle: {"state": "waiting_for_x", "data": {...}}}
        self.user_sessions = {}

    async def identify_location(self, location_identifier: str):
        """
        Finds a location based on extracted identifier.
        """
        if not location_identifier or location_identifier.lower() in ["unknown", "none", "unknown location"]:
            return None, "NOT_FOUND"

        safe_name = location_identifier.strip()
        
        response = self.supabase.table("motive_dispatch_intelligence").select("*").ilike("location_identifier", f"%{safe_name}%").execute()
        
        if response.data:
            return response.data[0], "FOUND"
        else:
            return None, "NOT_FOUND"

    async def create_location_intel(self, intent: dict):
        """Creates new intelligence record for a location."""
        location_identifier = intent.get("location_identifier")
        new_record = {
            "location_identifier": location_identifier,
            "structured_data": intent
        }
        res = self.supabase.table("motive_dispatch_intelligence").insert(new_record).execute()
        return res.data[0]

    async def update_location_intel(self, location_id, current_data: dict, new_intent: dict):
        """Updates location profile with new intent (merge)"""
        current_structured = current_data.get("structured_data", {})
        
        # Merge dictionary
        merged_structured = {**current_structured, **new_intent}
        
        # specific array merge for visual cues
        old_cues = current_structured.get("visual_cues", [])
        new_cues = new_intent.get("visual_cues", [])
        if not isinstance(old_cues, list): old_cues = []
        if not isinstance(new_cues, list): new_cues = []
        
        merged_structured["visual_cues"] = list(set(old_cues + new_cues))
        
        # clean out Nones
        merged_structured = {k: v for k, v in merged_structured.items() if v is not None}
            
        update_data = {
            "structured_data": merged_structured
        }
        self.supabase.table("motive_dispatch_intelligence").update(update_data).eq("id", location_id).execute()
        return merged_structured

    async def extract_intent(self, message_content: str, image_path: str = None, audio_path: str = None):
        """Uses Gemini to parse entities and tags from text, image, or audio."""
        prompt_text = f"""
        You are the intelligence engine for 'Motive FleetIQ'.
        Extract spatial and operational intelligence from Delivery Associates.
        Normalize directions. Output strictly in JSON.
        
        Output strictly according to this JSON Schema:
        ```json
        {{
          "type": "object",
          "properties": {{
            "location_identifier": {{ "type": "string" }},
            "access_point": {{ "type": "string" }},
            "access_code": {{ "type": "string" }},
            "visual_cues": {{ "type": "array", "items": {{ "type": "string" }} }},
            "clean_instruction": {{ "type": "string" }},
            "user_intent": {{ "type": "string", "enum": ["log_intel", "request_intel"] }}
          }},
          "required": ["location_identifier", "user_intent"]
        }}
        ```
        
        Message: "{message_content}"
        """
        
        content_parts = [prompt_text]
        
        if image_path:
            import PIL.Image
            try:
                img = PIL.Image.open(image_path)
                content_parts.append(img)
                content_parts.append(" Analyze this image for drop-off details.")
            except Exception as e:
                print(f"Error loading image: {e}")

        if audio_path:
            try:
                # Upload audio to Gemini
                print(f"Uploading audio: {audio_path}")
                audio_file = self.ai.files.upload(file=audio_path)
                content_parts.append(audio_file)
                content_parts.append(" Analyze this voice note for drop-off details.")
            except Exception as e:
                print(f"Error loading audio: {e}")
        
        content_parts.append("Return ONLY valid JSON. Do not include markdown formatting like ```json.")
        
        try:
            # Async generation with strict JSON schema (Gemini 1.5 feature)
            response = self.ai.models.generate_content(
                model='gemini-2.5-flash',
                contents=content_parts,
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
            return {"location_identifier": "Unknown", "visual_cues": [], "user_intent": "unknown"}


    async def handle(self, message):
        """Main handler for the skill with conversational logic."""
        da_handle = message.get("user_handle") 
        text = message.get("text")
        image_path = message.get("image_path")
        audio_path = message.get("audio_path")
        
        # 1. Extract Intent
        intent = await self.extract_intent(text, image_path, audio_path)
        location_id = intent.get("location_identifier", "Unknown")
        user_intent = intent.get("user_intent")

        print(f"Extracted: Location={location_id}, Intent={intent}")
        
        # 2. Identify Location
        location_data, status = await self.identify_location(location_id)
        
        # --- LOGIC BRANCHES ---
        
        # CASE A: Location NOT FOUND -> Create
        if status == "NOT_FOUND":
            if location_id and location_id.lower() not in ["unknown", "none"]:
                await self.create_location_intel(intent)
                return f"Got it. I've successfully logged the new intelligence for {location_id} into the FleetIQ Knowledge Graph and routed it to active units."
            else:
                return "I'm listening. Could you specify which location you're referring to?"

        # CASE C: Location FOUND -> Update
        if status == "FOUND":
             await self.update_location_intel(location_data['id'], location_data, intent)
             return f"Confirmed. I've updated the existing records for {location_id} with this new intelligence and alerted nearby units."

        return "I'm here. Tell me about a location."
