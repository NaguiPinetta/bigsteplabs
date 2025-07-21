-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (get_user_role(auth.uid()) = 'Admin');
CREATE POLICY "Admins can manage all users" ON users FOR ALL USING (get_user_role(auth.uid()) = 'Admin');

-- Modules policies
CREATE POLICY "Students can view published modules" ON modules FOR SELECT USING (
    is_published = true AND get_user_role(auth.uid()) = 'Student'
);
CREATE POLICY "Admins and Collaborators can view all modules" ON modules FOR SELECT USING (
    get_user_role(auth.uid()) IN ('Admin', 'Collaborator')
);
CREATE POLICY "Admins and Collaborators can manage modules" ON modules FOR ALL USING (
    get_user_role(auth.uid()) IN ('Admin', 'Collaborator')
);

-- Units policies
CREATE POLICY "Students can view published units in published modules" ON units FOR SELECT USING (
    is_published = true 
    AND get_user_role(auth.uid()) = 'Student'
    AND EXISTS (SELECT 1 FROM modules WHERE modules.id = units.module_id AND modules.is_published = true)
);
CREATE POLICY "Admins and Collaborators can view all units" ON units FOR SELECT USING (
    get_user_role(auth.uid()) IN ('Admin', 'Collaborator')
);
CREATE POLICY "Admins and Collaborators can manage units" ON units FOR ALL USING (
    get_user_role(auth.uid()) IN ('Admin', 'Collaborator')
);

-- Content policies
CREATE POLICY "Students can view published content in accessible units" ON content FOR SELECT USING (
    is_published = true 
    AND get_user_role(auth.uid()) = 'Student'
    AND EXISTS (
        SELECT 1 FROM units u 
        JOIN modules m ON u.module_id = m.id 
        WHERE u.id = content.unit_id 
        AND u.is_published = true 
        AND m.is_published = true
    )
);
CREATE POLICY "Admins and Collaborators can view all content" ON content FOR SELECT USING (
    get_user_role(auth.uid()) IN ('Admin', 'Collaborator')
);
CREATE POLICY "Admins and Collaborators can manage content" ON content FOR ALL USING (
    get_user_role(auth.uid()) IN ('Admin', 'Collaborator')
);

-- Datasets policies
CREATE POLICY "Users can view their own datasets" ON datasets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all datasets" ON datasets FOR SELECT USING (get_user_role(auth.uid()) = 'Admin');
CREATE POLICY "Users can create datasets" ON datasets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own datasets" ON datasets FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all datasets" ON datasets FOR ALL USING (get_user_role(auth.uid()) = 'Admin');

-- Content chunks policies
CREATE POLICY "Users can view chunks of their datasets" ON content_chunks FOR SELECT USING (
    EXISTS (SELECT 1 FROM datasets WHERE datasets.id = content_chunks.dataset_id AND datasets.user_id = auth.uid())
);
CREATE POLICY "Admins can view all chunks" ON content_chunks FOR SELECT USING (get_user_role(auth.uid()) = 'Admin');
CREATE POLICY "Users can manage chunks of their datasets" ON content_chunks FOR ALL USING (
    EXISTS (SELECT 1 FROM datasets WHERE datasets.id = content_chunks.dataset_id AND datasets.user_id = auth.uid())
);
CREATE POLICY "Admins can manage all chunks" ON content_chunks FOR ALL USING (get_user_role(auth.uid()) = 'Admin');

-- Personas policies
CREATE POLICY "All authenticated users can view personas" ON personas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins and Collaborators can manage personas" ON personas FOR ALL USING (
    get_user_role(auth.uid()) IN ('Admin', 'Collaborator')
);

-- Models policies
CREATE POLICY "Admins can view and manage models" ON models FOR ALL USING (get_user_role(auth.uid()) = 'Admin');
CREATE POLICY "Collaborators can view active models" ON models FOR SELECT USING (
    is_active = true AND get_user_role(auth.uid()) = 'Collaborator'
);

-- Agents policies
CREATE POLICY "All authenticated users can view active agents" ON agents FOR SELECT USING (
    is_active = true AND auth.uid() IS NOT NULL
);
CREATE POLICY "Admins and Collaborators can manage agents" ON agents FOR ALL USING (
    get_user_role(auth.uid()) IN ('Admin', 'Collaborator')
);

-- Unit agents policies
CREATE POLICY "Students can view active unit agents for accessible units" ON unit_agents FOR SELECT USING (
    is_active = true 
    AND get_user_role(auth.uid()) = 'Student'
    AND EXISTS (
        SELECT 1 FROM units u 
        JOIN modules m ON u.module_id = m.id 
        WHERE u.id = unit_agents.unit_id 
        AND u.is_published = true 
        AND m.is_published = true
    )
);
CREATE POLICY "Admins and Collaborators can manage unit agents" ON unit_agents FOR ALL USING (
    get_user_role(auth.uid()) IN ('Admin', 'Collaborator')
);

-- Chat sessions policies
CREATE POLICY "Users can view their own chat sessions" ON chat_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create chat sessions" ON chat_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own chat sessions" ON chat_sessions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can view all chat sessions" ON chat_sessions FOR SELECT USING (get_user_role(auth.uid()) = 'Admin');

-- Messages policies
CREATE POLICY "Users can view messages from their sessions" ON messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM chat_sessions WHERE chat_sessions.id = messages.session_id AND chat_sessions.user_id = auth.uid())
);
CREATE POLICY "Users can create messages in their sessions" ON messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM chat_sessions WHERE chat_sessions.id = session_id AND chat_sessions.user_id = auth.uid())
);
CREATE POLICY "Admins can view all messages" ON messages FOR SELECT USING (get_user_role(auth.uid()) = 'Admin');

-- User progress policies
CREATE POLICY "Users can view their own progress" ON user_progress FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own progress" ON user_progress FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can view all user progress" ON user_progress FOR SELECT USING (get_user_role(auth.uid()) = 'Admin'); 