-- 1. Drop existing check constraint
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_status_check;

-- 2. Update existing data
UPDATE clients SET status = 'planning' WHERE status = 'negotiation';

-- 3. Add new check constraint
ALTER TABLE clients ADD CONSTRAINT clients_status_check 
CHECK (status IN ('lead', 'proposal', 'planning', 'closed', 'archive'));
