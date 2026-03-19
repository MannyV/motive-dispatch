# Motive Introduces "Dispatch": A Conversational Knowledge Graph to Eliminate Last-50-Feet Delivery Friction.

**Date**: February 20, 2026

### The Problem
Off-the-shelf routing APIs (Google Maps, Mapbox) only take a driver to the curb. For commercial deliveries, the *real* friction starts after the van parks: finding hidden service entrances, acquiring gate codes, or knowing that the front desk refuses large packages. 

### The FleetIQ Solution
FleetIQ is an AI-powered, hyper-local knowledge graph built passively through natural language. It allows Delivery Associates (DAs) to log and retrieve complex drop-off instructions using simple voice notes, ensuring that the tribal knowledge of veteran drivers is instantly accessible to the entire DSP fleet, protecting speed metrics and DSP profitability.

### How it works
FleetIQ operates directly in the DA's workflow via messaging apps. A DA simply speaks to FleetIQ (e.g., "Building C front door is broken, use the alley"). An LLM parses this unstructured data into a strict spatial database. When the next DA approaches that same complex building, FleetIQ proactively retrieves the structured notes and pushes a clean, hyper-local instruction to their device, eliminating the search time.

## FAQ

**How does this improve the DSP's financial outcomes?**
By reducing the time spent searching for access points, DAs complete their high-intensity SSD blocks faster. This reduces the DSP's variable hourly costs and protects their Scorecard Performance Bonuses (specifically Delivery Success Rate and OTD).

**Why will DAs actually use this?**
Because it requires zero form-filling. DAs simply hold a button and speak. It aligns with the DA's physical momentum, improving the DA experience by removing the frustration of complex urban drops.

---

## Setup & Architecture
- **Memory**: Supabase (PostgreSQL + Realtime)
- **Listener**: Telegram Bot (`gateway.py`)
- **Brain**: Skill Router (`router.py`)
- **Skills**: Modular capabilities (`skills/fleetiq.py`)

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
2. Send a voice note or message like:
   > "Building C front door is broken, use the alley"
3. The bot will extract spatial data and log it in Supabase for future DA routing.
