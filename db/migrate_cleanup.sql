-- Migration: Remove 'Outreach' status for Motive Dispatch Style Refinement

-- 1. Temporarily drop the constraint
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_status_check;

-- 2. Migrate existing data: 'outreach' -> 'lead'
UPDATE clients SET status = 'lead' WHERE status = 'outreach';

-- 3. Add new constraint (removing 'outreach')
ALTER TABLE clients 
ADD CONSTRAINT clients_status_check 
CHECK (status IN ('lead', 'proposal', 'negotiation', 'closed', 'archive'));
