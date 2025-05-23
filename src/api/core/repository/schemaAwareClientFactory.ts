
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

/**
 * Configuration for schema-aware client
 */
export interface SchemaConfig {
  /**
   * Schema name to use (default: 'public')
   */
  schema: string;
  
  /**
   * Base URL for Supabase
   */
  supabaseUrl?: string;
  
  /**
   * API key for Supabase
   */
  supabaseKey?: string;
}

/**
 * Create a Supabase client configured to use a specific schema
 */
export function createSchemaAwareClient(
  config: SchemaConfig
): SupabaseClient<Database> {
  const { schema, supabaseUrl, supabaseKey } = config;
  
  // Use environment variables if not provided
  const url = supabaseUrl || process.env.SUPABASE_URL || 'https://nvaqqkffmfuxdnwnqhxo.supabase.co';
  const key = supabaseKey || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!key) {
    throw new Error('Supabase API key is required');
  }
  
  // Create Supabase client with headers to set search_path
  const client = createClient<Database>(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      // Set PostgreSQL search_path to use our schema
      headers: {
        'x-supabase-schema': schema
      }
    }
  });
  
  console.log(`Created schema-aware Supabase client for schema: ${schema}`);
  
  return client;
}

/**
 * Get the current schema being used (for testing purposes)
 */
export function getCurrentSchema(): string {
  // For Node.js environment (tests)
  if (typeof process !== 'undefined' && process.env) {
    return process.env.SUPABASE_SCHEMA || 'public';
  }
  
  // For browser environment
  return 'public';
}
