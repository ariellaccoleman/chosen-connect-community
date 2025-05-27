
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Hardcoded test project configuration (not secrets)
const TEST_PROJECT_CONFIG = {
  url: 'https://sqrjmydkggtcsxvrdmrz.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxcmpteWRrZ2d0Y3N4dnJkbXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxOTU2MTIsImV4cCI6MjA2Mzc3MTYxMn0.CXVBUniHzEXTQh6nH_h-l6gJ8nLlzbV6VkkbOhh4F5Y'
};

/**
 * Runtime function to detect test environment with comprehensive checks
 * Safe for both browser and Node.js environments
 */
const isTestEnvironment = (): boolean => {
  // First check if we're in a Node.js environment
  if (typeof process === "undefined") {
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
  const isTest = Object.values(checks).some(check => check === true);
  
  return isTest;
};

// Helper function to safely access environment variables with consistent test environment detection
const getEnvVar = (name: string): string | undefined => {
  // Use the same test environment detection as the rest of the TestClientFactory
  if (!isTestEnvironment() || typeof process === "undefined") {
    return undefined;
  }
  return process.env[name];
};

/**
 * Per-user client instances to prevent multiple GoTrueClient instances
 * Using separate Maps for different client types per worker
 */
const userClients = new Map<string, Map<string, SupabaseClient<Database>>>();
const workerServiceRoleClients = new Map<string, SupabaseClient<Database>>();
const userClientCreationLocks = new Map<string, Promise<void>>();
const userAuthenticationStatus = new Map<string, { isAuthenticated: boolean; authenticatedAt: number }>();

/**
 * Test Client Factory with Per-User Singleton Pattern
 * Each user gets their own dedicated Supabase client instance per worker
 */
export class TestClientFactory {
  private static workerId: string = getEnvVar('JEST_WORKER_ID') || 'main';
  private static readonly SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Ensure we're in a test environment - improved runtime detection
   */
  private static ensureTestEnvironment(): void {
    const isTest = isTestEnvironment();
    
    if (!isTest) {
      console.warn('🔍 TestClientFactory: Environment detection results:');
      console.warn('- Not in an obvious test environment');
      if (typeof process !== "undefined") {
        console.warn('- NODE_ENV:', process.env.NODE_ENV);
        console.warn('- CI:', process.env.CI);
        console.warn('- GITHUB_ACTIONS:', process.env.GITHUB_ACTIONS);
        console.warn('- TEST_RUN_ID:', process.env.TEST_RUN_ID);
        console.warn('- JEST_WORKER_ID:', process.env.JEST_WORKER_ID);
      } else {
        console.warn('- Running in browser environment (process not available)');
      }
      console.warn('⚠️ Proceeding with caution - ensure this is intentional');
    } else {
      console.log(`✅ TestClientFactory: Test environment detected successfully (Worker: ${this.workerId})`);
    }
  }

  /**
   * Get the user client key for a given email
   */
  private static getUserClientKey(userEmail: string): string {
    return `${this.workerId}_${userEmail}`;
  }

  /**
   * Initialize worker-specific user client map if it doesn't exist
   */
  private static ensureWorkerClientMap(): Map<string, SupabaseClient<Database>> {
    if (!userClients.has(this.workerId)) {
      userClients.set(this.workerId, new Map<string, SupabaseClient<Database>>());
    }
    return userClients.get(this.workerId)!;
  }

  /**
   * Wait for session to be fully established with timeout
   */
  private static async waitForSessionEstablished(client: SupabaseClient<Database>, userEmail: string, maxAttempts = 10): Promise<boolean> {
    const startTime = Date.now();
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { data: { session }, error } = await client.auth.getSession();
        
        if (error) {
          console.warn(`🔍 Worker ${this.workerId}: Session check ${attempt}/${maxAttempts} failed for ${userEmail}:`, error.message);
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }
        
        if (session && session.user && session.access_token && session.user.email === userEmail) {
          console.log(`✅ Worker ${this.workerId}: Session established for ${userEmail} on attempt ${attempt}/${maxAttempts}`);
          return true;
        }
        
        console.warn(`⚠️ Worker ${this.workerId}: Session not ready for ${userEmail} ${attempt}/${maxAttempts} - missing session or token or email mismatch`);
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Worker ${this.workerId}: Session check error for ${userEmail} ${attempt}/${maxAttempts}:`, error);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Check for timeout
      if (Date.now() - startTime > this.SESSION_TIMEOUT_MS) {
        console.error(`❌ Worker ${this.workerId}: Session establishment timed out for ${userEmail} after ${this.SESSION_TIMEOUT_MS}ms`);
        return false;
      }
    }
    
    console.error(`❌ Worker ${this.workerId}: Session establishment failed for ${userEmail} after ${maxAttempts} attempts`);
    return false;
  }

  /**
   * Get or create a dedicated client for a specific user
   * Each user gets their own client instance that persists for the worker lifecycle
   */
  static async getUserClient(userEmail: string, userPassword: string): Promise<SupabaseClient<Database>> {
    this.ensureTestEnvironment();

    const userClientKey = this.getUserClientKey(userEmail);
    const workerClientMap = this.ensureWorkerClientMap();
    
    // Check if we already have an authenticated client for this user
    if (workerClientMap.has(userEmail)) {
      const existingClient = workerClientMap.get(userEmail)!;
      const authStatus = userAuthenticationStatus.get(userClientKey);
      
      // Verify session is still valid
      const { data: { session } } = await existingClient.auth.getSession();
      
      if (session && session.user && session.access_token && session.user.email === userEmail) {
        // Check if session is too old
        if (authStatus && Date.now() - authStatus.authenticatedAt > this.SESSION_TIMEOUT_MS) {
          console.log(`⚠️ Worker ${this.workerId}: Session expired for ${userEmail}, recreating client`);
          await this.removeUserClient(userEmail);
        } else {
          console.log(`🔄 Worker ${this.workerId}: Using existing authenticated client for ${userEmail}`);
          return existingClient;
        }
      } else {
        console.log(`⚠️ Worker ${this.workerId}: Invalid session for ${userEmail}, recreating client`);
        await this.removeUserClient(userEmail);
      }
    }

    // Create a lock for this user if one doesn't exist
    if (!userClientCreationLocks.has(userClientKey)) {
      userClientCreationLocks.set(userClientKey, new Promise<void>(async (resolve) => {
        try {
          console.log(`🔧 Worker ${this.workerId}: Creating dedicated client for ${userEmail}`);
          
          // Create client with user-specific storage key
          const client = createClient<Database>(TEST_PROJECT_CONFIG.url, TEST_PROJECT_CONFIG.anonKey, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              storageKey: `test_auth_${this.workerId}_${userEmail}`,
            }
          });
          
          // Authenticate the client
          console.log(`🔐 Worker ${this.workerId}: Authenticating client for ${userEmail}`);
          
          const { data, error } = await client.auth.signInWithPassword({
            email: userEmail,
            password: userPassword
          });

          if (error) {
            throw new Error(`Failed to authenticate client for ${userEmail}: ${error.message}`);
          }

          if (!data.session || !data.user) {
            throw new Error(`Authentication succeeded but no session/user returned for ${userEmail}`);
          }

          console.log(`✅ Worker ${this.workerId}: Client authenticated for ${userEmail} (User ID: ${data.user.id})`);
          
          // Wait for session to be fully established
          const sessionReady = await this.waitForSessionEstablished(client, userEmail);
          if (!sessionReady) {
            throw new Error(`Session establishment failed for ${userEmail}`);
          }
          
          // Store the authenticated client
          workerClientMap.set(userEmail, client);
          userAuthenticationStatus.set(userClientKey, {
            isAuthenticated: true,
            authenticatedAt: Date.now()
          });
          
          console.log(`🔐 Worker ${this.workerId}: Session established and verified for ${userEmail}`);
        } finally {
          resolve();
        }
      }));
    }

    // Wait for the lock to be released
    await userClientCreationLocks.get(userClientKey);
    
    // Get the client after creation is complete
    const client = workerClientMap.get(userEmail);
    if (!client) {
      throw new Error(`Failed to create client for user ${userEmail} in worker ${this.workerId}`);
    }
    
    return client;
  }

  /**
   * Check if a user client exists and is authenticated
   */
  static hasUserClient(userEmail: string): boolean {
    const workerClientMap = userClients.get(this.workerId);
    if (!workerClientMap) return false;
    
    const userClientKey = this.getUserClientKey(userEmail);
    const authStatus = userAuthenticationStatus.get(userClientKey);
    
    return workerClientMap.has(userEmail) && authStatus?.isAuthenticated === true;
  }

  /**
   * Remove a specific user's client
   */
  static async removeUserClient(userEmail: string): Promise<void> {
    const workerClientMap = userClients.get(this.workerId);
    if (!workerClientMap) return;
    
    const userClientKey = this.getUserClientKey(userEmail);
    
    if (workerClientMap.has(userEmail)) {
      try {
        const client = workerClientMap.get(userEmail)!;
        console.log(`🚪 Worker ${this.workerId}: Signing out and removing client for ${userEmail}`);
        await client.auth.signOut();
      } catch (error) {
        console.warn(`Warning during signout for ${userEmail}:`, error);
      }
      
      workerClientMap.delete(userEmail);
      userAuthenticationStatus.delete(userClientKey);
      userClientCreationLocks.delete(userClientKey);
      console.log(`✅ Worker ${this.workerId}: Removed client for ${userEmail}`);
    }
  }

  /**
   * Clear all user clients for this worker
   */
  static async clearAllUserClients(): Promise<void> {
    const workerClientMap = userClients.get(this.workerId);
    if (!workerClientMap) return;
    
    console.log(`🧹 Worker ${this.workerId}: Clearing all user clients`);
    
    const userEmails = Array.from(workerClientMap.keys());
    await Promise.all(userEmails.map(email => this.removeUserClient(email)));
    
    userClients.delete(this.workerId);
    console.log(`✅ Worker ${this.workerId}: All user clients cleared`);
  }

  /**
   * Get the current authenticated user from a specific user's client
   */
  static async getCurrentAuthenticatedUser(userEmail: string): Promise<any> {
    const workerClientMap = userClients.get(this.workerId);
    if (!workerClientMap || !workerClientMap.has(userEmail)) {
      throw new Error(`No authenticated client found for user ${userEmail} in worker ${this.workerId}`);
    }
    
    const client = workerClientMap.get(userEmail)!;
    
    console.log(`🔍 Worker ${this.workerId}: Getting current user from client for ${userEmail}`);
    
    const { data: { session }, error: sessionError } = await client.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error(`Failed to get session from client for ${userEmail}: ${sessionError.message}`);
    }
    
    if (!session) {
      console.error(`No active session found for ${userEmail}`);
      throw new Error(`No active session for ${userEmail}`);
    }

    console.log(`✅ Worker ${this.workerId}: Found active session for user: ${session.user.email}`);
    return session.user;
  }

  // Legacy methods for backward compatibility during migration
  
  /**
   * @deprecated Use getUserClient() instead. This method will be removed after migration.
   */
  static async getSharedTestClient(): Promise<SupabaseClient<Database>> {
    console.warn('⚠️ getSharedTestClient() is deprecated. Use getUserClient() with specific user credentials.');
    // Return a basic anon client for backward compatibility
    return this.getAnonClient();
  }

  /**
   * @deprecated Use getUserClient() instead. This method will be removed after migration.
   */
  static async authenticateSharedClient(userEmail: string, userPassword: string): Promise<SupabaseClient<Database>> {
    console.warn('⚠️ authenticateSharedClient() is deprecated. Use getUserClient() instead.');
    return this.getUserClient(userEmail, userPassword);
  }

  /**
   * @deprecated Use removeUserClient() or clearAllUserClients() instead.
   */
  static async signOutSharedClient(): Promise<void> {
    console.warn('⚠️ signOutSharedClient() is deprecated. Use removeUserClient() or clearAllUserClients() instead.');
  }

  /**
   * Get service role client for test data setup and cleanup
   * Service role key is now REQUIRED for all test operations
   */
  static getServiceRoleClient(): SupabaseClient<Database> {
    this.ensureTestEnvironment();

    if (!workerServiceRoleClients.has(this.workerId)) {
      // Use direct process.env access instead of getEnvVar() to avoid environment detection issues
      const serviceRoleKey = typeof process !== "undefined" ? process.env.TEST_SUPABASE_SERVICE_ROLE_KEY : undefined;
      
      if (!serviceRoleKey) {
        console.error('❌ TEST_SUPABASE_SERVICE_ROLE_KEY is missing from environment variables');
        if (typeof process !== "undefined") {
          console.error('❌ Available environment variables:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
          console.error('❌ Direct process.env check:', typeof process.env.TEST_SUPABASE_SERVICE_ROLE_KEY);
        } else {
          console.error('❌ Running in browser environment - process not available');
        }
        throw new Error(
          'TEST_SUPABASE_SERVICE_ROLE_KEY is required for all test operations. ' +
          'This should have been validated during test setup. Please check your test runner configuration.'
        );
      }

      console.log(`🔧 Worker ${this.workerId}: Creating worker-specific service role client`);
      
      const client = createClient<Database>(TEST_PROJECT_CONFIG.url, serviceRoleKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: `test_service_${this.workerId}`,
        }
      });

      workerServiceRoleClients.set(this.workerId, client);
    }
    
    return workerServiceRoleClients.get(this.workerId)!;
  }

  /**
   * Get anonymous client for testing application logic
   * Creates a simple anon client without authentication complexity
   */
  static getAnonClient(): SupabaseClient<Database> {
    this.ensureTestEnvironment();
    console.log('🔄 getAnonClient() creating simple anon client for testing');
    
    // Return a simple anon client for testing application logic
    return createClient<Database>(TEST_PROJECT_CONFIG.url, TEST_PROJECT_CONFIG.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        storageKey: `test_anon_${this.workerId}`,
      }
    });
  }

  /**
   * Clean up clients and auth state for this worker
   */
  static async cleanup(): Promise<void> {
    try {
      await this.clearAllUserClients();
    } catch (error) {
      console.warn('Cleanup warning during user clients cleanup:', error);
    }

    // Clear service role client for this worker
    if (workerServiceRoleClients.has(this.workerId)) {
      console.log(`🧹 Worker ${this.workerId}: Clearing worker-specific service role client`);
      workerServiceRoleClients.delete(this.workerId);
    }
    
    console.log(`✅ Worker ${this.workerId}: TestClientFactory cleanup complete`);
  }

  /**
   * Get test project info
   */
  static getTestProjectInfo(): { url: string; usingDedicatedProject: boolean } {
    const prodUrl = getEnvVar('SUPABASE_URL');

    console.log('🔍 TestProjectInfo:', {
      testUrl: TEST_PROJECT_CONFIG.url,
      prodUrl: prodUrl ? '[SET]' : '[NOT SET]',
    });

    return {
      url: TEST_PROJECT_CONFIG.url,
      usingDedicatedProject: !!prodUrl && TEST_PROJECT_CONFIG.url.trim() !== prodUrl.trim()
    };
  }

  /**
   * Get debug info about the current client state
   */
  static getDebugInfo() {
    const workerClientMap = userClients.get(this.workerId);
    const userClientCount = workerClientMap ? workerClientMap.size : 0;
    const authenticatedUsers = Array.from(userAuthenticationStatus.entries())
      .filter(([key, status]) => key.startsWith(`${this.workerId}_`) && status.isAuthenticated)
      .map(([key]) => key.replace(`${this.workerId}_`, ''));

    return {
      workerId: this.workerId,
      userClientCount,
      authenticatedUsers,
      hasServiceRoleClient: workerServiceRoleClients.has(this.workerId),
    };
  }
}

/**
 * Test Infrastructure for database-based testing
 */
export class TestInfrastructure {
  /**
   * Create test users for authentication testing
   */
  static async createTestUser(email: string, password: string, metadata?: any): Promise<any> {
    try {
      const serviceClient = TestClientFactory.getServiceRoleClient();
      
      const { data, error } = await serviceClient.auth.admin.createUser({
        email,
        password,
        user_metadata: metadata || {},
        email_confirm: true
      });

      if (error) {
        throw new Error(`Failed to create test user: ${error.message}`);
      }

      console.log(`✅ Created test user: ${email}`);
      return data.user;
    } catch (error) {
      console.error(`Failed to create test user ${email}:`, error);
      throw error;
    }
  }

  /**
   * Delete test users
   */
  static async deleteTestUser(userId: string): Promise<void> {
    try {
      const serviceClient = TestClientFactory.getServiceRoleClient();
      
      const { error } = await serviceClient.auth.admin.deleteUser(userId);

      if (error) {
        throw new Error(`Failed to delete test user: ${error.message}`);
      }

      console.log(`✅ Deleted test user: ${userId}`);
    } catch (error) {
      console.error(`Failed to delete test user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up test data from tables - using specific table names
   */
  static async cleanupTable(tableName: string): Promise<void> {
    try {
      const serviceClient = TestClientFactory.getServiceRoleClient();
      
      // Handle specific known tables
      if (tableName === 'profiles') {
        const { error } = await serviceClient
          .from('profiles')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (error) {
          console.warn(`Warning: Could not clean up table ${tableName}:`, error.message);
        } else {
          console.log(`✅ Cleaned up table: ${tableName}`);
        }
      } else {
        console.log(`⚠️ Cleanup not implemented for table: ${tableName}`);
      }
    } catch (error) {
      console.warn(`Warning: Could not clean up table ${tableName}:`, error);
    }
  }

  /**
   * Seed test data into a table - using specific table names
   */
  static async seedTable<T>(tableName: string, data: T[]): Promise<void> {
    if (!data || data.length === 0) return;

    try {
      const serviceClient = TestClientFactory.getServiceRoleClient();
      
      // Handle specific known tables
      if (tableName === 'profiles') {
        const { error } = await serviceClient
          .from('profiles')
          .insert(data);

        if (error) {
          throw new Error(`Failed to seed table ${tableName}: ${error.message}`);
        }

        console.log(`✅ Seeded ${data.length} records into ${tableName}`);
      } else {
        console.log(`⚠️ Seeding not implemented for table: ${tableName}`);
      }
    } catch (error) {
      console.error(`Failed to seed table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Get test project info
   */
  static getTestProjectInfo(): { url: string; usingDedicatedProject: boolean } {
    return TestClientFactory.getTestProjectInfo();
  }
}
