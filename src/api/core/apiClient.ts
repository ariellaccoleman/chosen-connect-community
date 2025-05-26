
import { supabase } from "@/integrations/supabase/client";
import { TestClientFactory } from "@/integrations/supabase/testClient";
import { handleApiError } from "./errorHandler";

/**
 * Detect if we're in a test environment
 */
const isTestEnvironment = (): boolean => {
  return typeof process !== 'undefined' && (
    process.env.NODE_ENV === 'test' ||
    typeof process.env.JEST_WORKER_ID !== 'undefined' ||
    typeof (global as any).__coverage__ !== 'undefined'
  );
};

/**
 * Get the appropriate Supabase client for the current environment
 */
const getSupabaseClient = () => {
  if (isTestEnvironment()) {
    // In test environment, try to get an authenticated client
    // This will fall back to anon client if no authentication is available
    return TestClientFactory.getAnonClient();
  }
  return supabase;
};

/**
 * Core API client that wraps Supabase client with error handling
 * This is a lightweight wrapper that provides consistent error handling
 */
export const apiClient = {
  // Database operations with error handling
  async query(callback: (client: typeof supabase) => any) {
    try {
      const client = getSupabaseClient();
      return await callback(client);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Auth operations with error handling
  async authQuery(callback: (auth: typeof supabase.auth) => any) {
    try {
      const client = getSupabaseClient();
      return await callback(client.auth);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Storage operations with error handling
  async storageQuery(callback: (storage: typeof supabase.storage) => any) {
    try {
      const client = getSupabaseClient();
      return await callback(client.storage);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Edge function calls with error handling
  async functionQuery(callback: (functions: typeof supabase.functions) => any) {
    try {
      const client = getSupabaseClient();
      return await callback(client.functions);
    } catch (error) {
      return handleApiError(error);
    }
  }
};
