-- Enable Realtime WebSockets for the motive_fleetiq_intelligence table
-- (Run this in the Supabase SQL Editor AFTER creating the table)

-- 1. Ensure the publication exists (Supabase creates 'supabase_realtime' by default, but good to check)
-- DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN CREATE PUBLICATION supabase_realtime; END IF; END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE motive_dispatch_intelligence;
