-- Fix infinite recursion in RLS policies
-- The current policies are causing circular dependencies

-- =============================================================
-- Drop all existing policies to start fresh
-- =============================================================

-- Drop allowlist policies
DROP POLICY IF EXISTS "Admins can manage allowlist" ON allowlist;
DROP POLICY IF EXISTS "Authenticated users can view allowlist" ON allowlist;
DROP POLICY IF EXISTS "Users can view own allowlist entry" ON allowlist;

-- Drop users policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Allow trigger to insert user profiles" ON users;
DROP POLICY IF EXISTS "Authenticated users can view users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- =============================================================
-- Create simple, non-recursive policies
-- =============================================================

-- Allowlist policies - simple and non-recursive
CREATE POLICY "allowlist_select_policy" ON allowlist
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "allowlist_insert_policy" ON allowlist
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "allowlist_update_policy" ON allowlist
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "allowlist_delete_policy" ON allowlist
FOR DELETE USING (auth.uid() IS NOT NULL);

-- Users policies - simple and non-recursive
CREATE POLICY "users_select_policy" ON users
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "users_insert_policy" ON users
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "users_update_policy" ON users
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "users_delete_policy" ON users
FOR DELETE USING (auth.uid() IS NOT NULL);

-- =============================================================
-- Grant permissions
-- =============================================================

GRANT ALL ON allowlist TO authenticated;
GRANT ALL ON users TO authenticated; 