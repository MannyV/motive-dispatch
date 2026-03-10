from skills.fleetiq import FleetIQSkill

class Router:
    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.fleetiq_skill = FleetIQSkill(supabase_client)

    async def route(self, message):
        """
        Decides which skill to use based on the input message.
        """
        text = message.get("text", "").lower()
        user_handle = message.get("user_handle")

        # Simple keyword-based routing for MVP
        # travel_keywords = [...] # Removed restrictive filter
        
        # Route EVERYTHING to the FleetIQ Skill (The "Brain")
        # In a real app, you'd use an LLM here to distinguish between "Travel Request", "Support", etc.
        print(f"Routing '{text}' to FleetIQ Skill...")
        return await self.fleetiq_skill.handle(message)
