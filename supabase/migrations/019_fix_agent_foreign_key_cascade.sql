-- Fix foreign key constraint on chat_sessions.agent_id to allow CASCADE deletion
-- This will allow agents to be deleted even if they have associated chat sessions

-- First, drop the existing foreign key constraint
ALTER TABLE chat_sessions 
DROP CONSTRAINT IF EXISTS chat_sessions_agent_id_fkey;

-- Re-create the foreign key constraint with CASCADE DELETE
ALTER TABLE chat_sessions 
ADD CONSTRAINT chat_sessions_agent_id_fkey 
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- Also fix the unit_id foreign key to be consistent
ALTER TABLE chat_sessions 
DROP CONSTRAINT IF EXISTS chat_sessions_unit_id_fkey;

ALTER TABLE chat_sessions 
ADD CONSTRAINT chat_sessions_unit_id_fkey 
FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE; 