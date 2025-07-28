-- Add DELETE policies for chat_sessions and messages tables
-- This fixes the issue where users cannot delete their own chat sessions

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can delete their own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can delete messages from their sessions" ON messages;
DROP POLICY IF EXISTS "Admins can delete all chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Admins can delete all messages" ON messages;

-- Add DELETE policy for chat_sessions
-- Users can delete their own chat sessions
CREATE POLICY "Users can delete their own chat sessions" ON chat_sessions
FOR DELETE USING (user_id = auth.uid());

-- Add DELETE policy for messages
-- Users can delete messages from their own sessions
CREATE POLICY "Users can delete messages from their sessions" ON messages
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM chat_sessions 
        WHERE chat_sessions.id = messages.session_id 
        AND chat_sessions.user_id = auth.uid()
    )
);

-- Also add DELETE policies for admins to manage all chat sessions and messages
CREATE POLICY "Admins can delete all chat sessions" ON chat_sessions
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Admin'
    )
);

CREATE POLICY "Admins can delete all messages" ON messages
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Admin'
    )
); 