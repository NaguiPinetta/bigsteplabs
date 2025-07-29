import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    console.log('🔍 Starting dataset diagnostics...');
    
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      checks: {}
    };

    // Check 1: Verify datasets table exists and has correct structure
    try {
      const { data: datasets, error: datasetsError } = await supabase
        .from('datasets')
        .select('*')
        .limit(1);
      
      diagnostics.checks.datasets_table = {
        exists: !datasetsError,
        error: datasetsError?.message || null,
        sample_data: datasets?.length || 0
      };
    } catch (error) {
      diagnostics.checks.datasets_table = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        sample_data: 0
      };
    }

    // Check 2: Verify dataset_chunks table exists and has correct structure
    try {
      const { data: chunks, error: chunksError } = await supabase
        .from('dataset_chunks')
        .select('*')
        .limit(1);
      
      diagnostics.checks.dataset_chunks_table = {
        exists: !chunksError,
        error: chunksError?.message || null,
        sample_data: chunks?.length || 0
      };
    } catch (error) {
      diagnostics.checks.dataset_chunks_table = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        sample_data: 0
      };
    }

    // Check 3: Verify content_chunks table exists (legacy)
    try {
      const { data: contentChunks, error: contentChunksError } = await supabase
        .from('content_chunks')
        .select('*')
        .limit(1);
      
      diagnostics.checks.content_chunks_table = {
        exists: !contentChunksError,
        error: contentChunksError?.message || null,
        sample_data: contentChunks?.length || 0
      };
    } catch (error) {
      diagnostics.checks.content_chunks_table = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        sample_data: 0
      };
    }

    // Check 4: Test RLS policies by trying to insert a test dataset
    try {
      const { data: testInsert, error: insertError } = await supabase
        .from('datasets')
        .insert({
          name: 'TEST_DATASET_DIAGNOSTIC',
          description: 'Temporary diagnostic dataset',
          user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          content_type: 'text',
          text_content: 'Test content',
          text_format: 'plain',
          total_chunks: 0,
          processing_status: 'pending',
          metadata: { diagnostic: true }
        })
        .select()
        .single();

      if (testInsert) {
        // Clean up the test dataset
        await supabase
          .from('datasets')
          .delete()
          .eq('id', testInsert.id);
      }

      diagnostics.checks.rls_policies = {
        insert_allowed: !insertError,
        error: insertError?.message || null,
        test_dataset_created: !!testInsert
      };
    } catch (error) {
      diagnostics.checks.rls_policies = {
        insert_allowed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        test_dataset_created: false
      };
    }

    // Check 5: Verify storage bucket exists
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      const datasetsBucket = buckets?.find(bucket => bucket.name === 'datasets');
      
      diagnostics.checks.storage_bucket = {
        exists: !!datasetsBucket,
        error: bucketsError?.message || null,
        bucket_name: datasetsBucket?.name || null
      };
    } catch (error) {
      diagnostics.checks.storage_bucket = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        bucket_name: null
      };
    }

    // Check 6: Get current user context
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      diagnostics.checks.user_context = {
        authenticated: !!user,
        error: userError?.message || null,
        user_id: user?.id || null,
        email: user?.email || null
      };
    } catch (error) {
      diagnostics.checks.user_context = {
        authenticated: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        user_id: null,
        email: null
      };
    }

    console.log('✅ Dataset diagnostics completed');
    return json(diagnostics);

  } catch (error) {
    console.error('❌ Error in dataset diagnostics:', error);
    return json({
      error: 'Failed to run diagnostics',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}; 