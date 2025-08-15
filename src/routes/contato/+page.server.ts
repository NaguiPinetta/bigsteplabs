import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { supabaseAdmin } from '$lib/server/supabase-admin';

export const actions: Actions = {
  default: async ({ request }) => {
    try {
      const formData = await request.formData();
      
      // Extract form data
      const name = formData.get('name') as string;
      const email = formData.get('email') as string;
      const phone = formData.get('phone') as string;
      const interest = formData.get('interest') as string;
      const message = formData.get('message') as string;
      
      // Basic validation
      if (!name || !email || !interest) {
        return fail(400, {
          error: 'Por favor, preencha todos os campos obrigatórios.',
          values: { name, email, phone, interest, message }
        });
      }
      
      if (!email.includes('@')) {
        return fail(400, {
          error: 'Por favor, insira um email válido.',
          values: { name, email, phone, interest, message }
        });
      }
      
      // Insert prospect into database
      const { data, error } = await supabaseAdmin
        .from('prospects')
        .insert([
          {
            name,
            email,
            phone: phone || null,
            interest,
            message: message || null,
            status: 'new',
            created_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) {
        console.error('Supabase error:', error);
        return fail(500, {
          error: 'Erro ao enviar mensagem. Tente novamente mais tarde.',
          values: { name, email, phone, interest, message }
        });
      }
      
      // Success response
      return {
        success: true,
        message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
        prospectId: data?.[0]?.id
      };
      
    } catch (error) {
      console.error('Server error:', error);
      return fail(500, {
        error: 'Erro interno do servidor. Tente novamente mais tarde.',
        values: {}
      });
    }
  }
};
