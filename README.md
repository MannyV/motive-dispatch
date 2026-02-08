# Fora Atlas MVP

Fora Atlas is an AI Operating System for Travel Advisors.

## Architecture
- **Memory**: Supabase (PostgreSQL + Realtime)
- **Listener**: Telegram Bot (`gateway.py`)
- **Brain**: Skill Router (`router.py`)
- **Skills**: Modular capabilities (`skills/advisor.py`)

## Setup

### 1. Database (Supabase)
1. Create a new Supabase project.
2. Go to the SQL Editor and run the contents of [`db/schema.sql`](db/schema.sql).
3. Get your Project URL and Anon Key from Project Settings > API.

### 2. Environment Variables
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your keys:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `TELEGRAM_BOT_TOKEN` (from @BotFather)
   - `GEMINI_API_KEY` (from Google AI Studio)

### 3. Dependencies
Install the required Python packages:
```bash
pip install -r requirements.txt
```

## Running the Agent
Run the main event loop:
```bash
python main.py
```

## Usage
1. Open your Telegram Bot.
2. Send a message like:
   > "Bella loves this brutalist hotel in Mexico City"
3. The bot will:
   - Identify "Bella" (or create a new client logic if implemented)
   - Extract "Mexico City" and "Brutalist" vibe.
   - Match with `inventory.json` (e.g., Condesa DF).
   - Save a **Draft Trip** to Supabase.
4. Check your Supabase `trips` table to see the result.
