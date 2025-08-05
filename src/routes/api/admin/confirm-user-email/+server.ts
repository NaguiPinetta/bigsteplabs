import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase-admin';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email } = await request.json();

    // Validate input
    if (!email) {
      return new Response(JSON.stringify({ 
        error: 'Email is required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }



    // Get user by email
    const { data: users, error: fetchError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (fetchError) {
      console.error('❌ Failed to fetch users:', fetchError);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch users' 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      return new Response(JSON.stringify({ 
        error: 'User not found' 
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update user to confirm email
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { 
        email_confirm: true,
        email_confirmed_at: new Date().toISOString()
      }
    );

    if (updateError) {
      console.error('❌ Failed to confirm email:', updateError);
      return new Response(JSON.stringify({ 
        error: updateError.message 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }



    return new Response(JSON.stringify({ 
      success: true,
      message: 'Email confirmed successfully'
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Unexpected error in confirm-user-email API:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};