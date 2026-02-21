-- Enable Realtime WebSockets for the atoz_dispatch_intelligence table
-- Run this snippet in your Supabase SQL Editor

-- 1. First, make sure the supabase_realtime publication exists (Supabase does this by default, but safe to check)
-- 2. Add our table to the publication so it broadcasts changes to our dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE atoz_dispatch_intelligence;
