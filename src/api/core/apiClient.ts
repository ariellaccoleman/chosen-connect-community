
import { supabase } from "@/integrations/supabase/client";
import { TestClientFactory } from "@/integrations/supabase/testClient";
import { handleApiError } from "./errorHandler";

/**
 * Runtime function to detect test environment with comprehensive checks
 */
const isTestEnvironment = (): boolean => {
  // Check if we're in Node.js environment first
  if (typeof window !== "undefined" || typeof process === "undefined") {
    return false;
  }

  const checks = {
    NODE_ENV: process.env.NODE_ENV === 'test',
    JEST_WORKER_ID: typeof process.env.JEST_WORKER_ID !== 'undefined',
    TEST_RUN_ID: typeof process.env.TEST_RUN_ID !== 'undefined',
    CI: process.env.CI === 'true',
    GITHUB_ACTIONS: process.env.GITHUB_ACTIONS === 'true',
    hasJestArg: process.argv.some(arg => arg.includes('jest')),
    hasCoverage: typeof (global as any).__coverage__ !== 'undefined'
  };

  // Return true if any test environment indicator is present
  return Object.values(checks).some(check => check === true);
};

/**
 * Get the appropriate Supabase client based on environment
 */
const getSupabaseClient = () => {
  if (isTestEnvironment()) {
    console.log('🧪 Using test Supabase client for API operations');
    return TestClientFactory.getAnonClient();
  }
  
  return supabase;
};

/**
 * Core API client that wraps Supabase client with error handling
 * Automatically uses test client in test environment
 */
export const apiClient = {
  // Database operations with error handling
  async query(callback: (client: any) => any) {
    try {
      const client = getSupabaseClient();
      return await callback(client);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Auth operations with error handling
  async authQuery(callback: (auth: any) => any) {
    try {
      const client = getSupabaseClient();
      return await callback(client.auth);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Storage operations with error handling
  async storageQuery(callback: (storage: any) => any) {
    try {
      const client = getSupabaseClient();
      return await callback(client.storage);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Edge function calls with error handling
  async functionQuery(callback: (functions: any) => any) {
    try {
      const client = getSupabaseClient();
      return await callback(client.functions);
    } catch (error) {
      return handleApiError(error);
    }
  }
};
