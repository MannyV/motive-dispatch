-- Enable the pg_trgm extension for text search if needed (optional but good practice)
create extension if not exists pg_trgm;

-- 1. Clients Table (Long-Term Memory)
create table clients (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone_handle text unique,  -- Identifying handle (e.g., Telegram username or phone number)
  vibe_tags text[] default '{}', -- Array of vibe tags (e.g., ["Eco-Chic", "Luxury"])
  facts jsonb default '{}'::jsonb, -- Flexible dictionary for unstructured facts (e.g., {"children": 3, "pet_name": "Buddy"})
  status text check (status in ('lead', 'active', 'booked', 'archive')) default 'lead',
  history_summary text,       -- Summarized interaction history
  created_at timestamptz default now()
);

-- 2. Trips Table (The Curator's Canvas)
create table trips (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete set null,
  status text check (status in ('draft', 'proposal', 'booked')) default 'draft',
  destination text,
  detected_entities jsonb default '{}'::jsonb, -- JSONB for flexible entity storage (e.g., {"hotel": "Hotel X", "dates": "..."})
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Messages Table (Raw Input Log)
create table messages (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete set null,
  content text not null,
  type text default 'text', -- 'text', 'image', 'video', etc.
  timestamp timestamptz default now()
);

-- Enable Realtime for the trips table so the dashboard can listen
alter publication supabase_realtime add table trips;

-- Policies (RLS) - Basic setup allowing public read/write for MVP simplicity (SECURE THIS LATER!)
alter table clients enable row level security;
alter table trips enable row level security;
alter table messages enable row level security;

create policy "Enable all access for MVP" on clients for all using (true);
create policy "Enable all access for MVP" on trips for all using (true);
create policy "Enable all access for MVP" on messages for all using (true);
