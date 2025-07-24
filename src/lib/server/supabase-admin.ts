import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Server-side Supabase client with service role key (admin privileges)
// This should ONLY be used in server-side code (API routes, load functions, etc.)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase service role configuration for server-side operations');
}

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper functions for admin operations
export async function createUserProfile(userId: string, email: string, role: string = 'Student') {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      id: userId,
      email,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create user profile:', error);
    throw error;
  }

  return data;
}

export async function updateUserRole(userId: string, role: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update user role:', error);
    throw error;
  }

  return data;
} 