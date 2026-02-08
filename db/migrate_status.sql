-- Migration: Update Client Statuses for Pipeline View

-- 1. Temporarily drop the constraint
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_status_check;

-- 2. Update existing data to match new statuses (map 'active' -> 'outreach')
UPDATE clients SET status = 'outreach' WHERE status = 'active';

-- 3. Add new constraint
ALTER TABLE clients 
ADD CONSTRAINT clients_status_check 
CHECK (status IN ('lead', 'outreach', 'proposal', 'negotiation', 'closed', 'archive'));
