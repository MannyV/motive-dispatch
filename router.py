from skills.advisor import AdvisorSkill

class Router:
    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.advisor_skill = AdvisorSkill(supabase_client)

    async def route(self, message):
        """
        Decides which skill to use based on the input message.
        """
        text = message.get("text", "").lower()
        user_handle = message.get("user_handle")

        # Simple keyword-based routing for MVP
        travel_keywords = ["hotel", "trip", "travel", "vacation", "flight", "beach", "city", "book", "reserve", "tulum", "mexico"]
        
        if any(keyword in text for keyword in travel_keywords):
            print(f"Routing '{text}' to Advisor Skill...")
            return await self.advisor_skill.handle(message)
        
        # Default fallback
        return "I'm not sure how to help with that yet. Try asking about a trip or hotel!"
