import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase-admin';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { userId, email, role, password } = await request.json();

    // Validate input
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'User ID is required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }



    // Update user in auth system if password is provided
    if (password) {
      if (password.length < 8) {
        return new Response(JSON.stringify({ 
          error: 'Password must be at least 8 characters long' 
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { 
          password,
          user_metadata: role ? { role } : undefined
        }
      );

      if (authError) {
        console.error('❌ Failed to update auth user:', authError);
        return new Response(JSON.stringify({ 
          error: authError.message 
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Update user profile in users table
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (email) updateData.email = email;
    if (role) updateData.role = role;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to update user profile:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to update user profile' 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }



    return new Response(JSON.stringify({ 
      success: true,
      user: data 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Unexpected error in update-user API:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 