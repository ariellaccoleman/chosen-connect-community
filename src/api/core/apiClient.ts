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
 * Wait for session to be established and verified
 */
const waitForSessionReady = async (client: any, maxAttempts = 5, delayMs = 100): Promise<boolean> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { data: { session }, error } = await client.auth.getSession();
      
      if (error) {
        console.warn(`🔍 Session check attempt ${attempt}/${maxAttempts} failed:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      
      if (session && session.user && session.access_token) {
        console.log(`✅ Session verified on attempt ${attempt}/${maxAttempts} - User: ${session.user.email}`);
        return true;
      }
      
      console.warn(`⚠️ Session not ready on attempt ${attempt}/${maxAttempts} - missing session or token`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (error) {
      console.error(`❌ Session verification error on attempt ${attempt}/${maxAttempts}:`, error);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.error(`❌ Session verification failed after ${maxAttempts} attempts`);
  return false;
};

/**
 * Get the appropriate Supabase client based on environment
 */
const getSupabaseClient = async () => {
  if (isTestEnvironment()) {
    console.log('🧪 Using shared test Supabase client for API operations');
    return await TestClientFactory.getSharedTestClient();
  }
  
  return supabase;
};

/**
 * Execute operation with session verification in test mode
 */
const executeWithSessionVerification = async (client: any, callback: (client: any) => any) => {
  if (!isTestEnvironment()) {
    // In production, execute directly
    return await callback(client);
  }
  
  // In test mode, verify session first
  const sessionReady = await waitForSessionReady(client);
  
  if (!sessionReady) {
    console.error('❌ Cannot execute operation - session not ready');
    throw new Error('Session not ready for API operation');
  }
  
  try {
    const result = await callback(client);
    
    // Check if we got an RLS violation and retry once
    if (result?.error?.message?.includes('row-level security') || 
        result?.error?.code === 'PGRST301') {
      console.warn('⚠️ RLS violation detected, retrying with fresh session check...');
      
      // Wait a bit and verify session again
      await new Promise(resolve => setTimeout(resolve, 50));
      const retrySessionReady = await waitForSessionReady(client, 3, 50);
      
      if (retrySessionReady) {
        console.log('🔄 Retrying operation after session verification...');
        return await callback(client);
      } else {
        console.error('❌ Retry failed - session still not ready');
        throw new Error('Authentication failed - session not established');
      }
    }
    
    return result;
  } catch (error) {
    console.error('❌ Operation failed:', error);
    throw error;
  }
};

/**
 * Core API client that wraps Supabase client with error handling
 * Automatically uses shared test client in test environment with session verification
 */
export const apiClient = {
  // Database operations with error handling and session verification
  async query(callback: (client: any) => any) {
    try {
      const client = await getSupabaseClient();
      return await executeWithSessionVerification(client, callback);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Auth operations with error handling
  async authQuery(callback: (auth: any) => any) {
    try {
      const client = await getSupabaseClient();
      return await callback(client.auth);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Storage operations with error handling
  async storageQuery(callback: (storage: any) => any) {
    try {
      const client = await getSupabaseClient();
      return await executeWithSessionVerification(client, (c) => callback(c.storage));
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Edge function calls with error handling
  async functionQuery(callback: (functions: any) => any) {
    try {
      const client = await getSupabaseClient();
      return await executeWithSessionVerification(client, (c) => callback(c.functions));
    } catch (error) {
      return handleApiError(error);
    }
  }
};
