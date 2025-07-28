-- Fix conflict between permissive policies and specific DELETE policies
-- The issue is that migration 005 created very permissive policies that override the specific DELETE policies

-- Drop the overly permissive policies that are causing conflicts
DROP POLICY IF EXISTS "Authenticated users can view all chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Authenticated users can view all messages" ON messages;

-- Re-create the proper policies for chat_sessions
CREATE POLICY "Users can view their own chat sessions" ON chat_sessions 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create chat sessions" ON chat_sessions 
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own chat sessions" ON chat_sessions 
FOR UPDATE USING (user_id = auth.uid());

-- Ensure the DELETE policies are properly applied
CREATE POLICY "Users can delete their own chat sessions" ON chat_sessions
FOR DELETE USING (user_id = auth.uid());

-- Re-create the proper policies for messages
CREATE POLICY "Users can view messages from their sessions" ON messages 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM chat_sessions WHERE chat_sessions.id = messages.session_id AND chat_sessions.user_id = auth.uid())
);

CREATE POLICY "Users can create messages in their sessions" ON messages 
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM chat_sessions WHERE chat_sessions.id = session_id AND chat_sessions.user_id = auth.uid())
);

-- Ensure the DELETE policies are properly applied
CREATE POLICY "Users can delete messages from their sessions" ON messages
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM chat_sessions 
        WHERE chat_sessions.id = messages.session_id 
        AND chat_sessions.user_id = auth.uid()
    )
);

-- Add admin policies for chat management
CREATE POLICY "Admins can view all chat sessions" ON chat_sessions 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Admin'
    )
);

CREATE POLICY "Admins can manage all chat sessions" ON chat_sessions 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Admin'
    )
);

CREATE POLICY "Admins can view all messages" ON messages 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Admin'
    )
);

CREATE POLICY "Admins can manage all messages" ON messages 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Admin'
    )
);

-- Verify the policies were created correctly
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('chat_sessions', 'messages')
ORDER BY tablename, cmd, policyname; 