import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Hardcoded test project configuration (not secrets)
const TEST_PROJECT_CONFIG = {
  url: 'https://sqrjmydkggtcsxvrdmrz.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxcmpteWRrZ2d0Y3N4dnJkbXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxOTU2MTIsImV4cCI6MjA2Mzc3MTYxMn0.CXVBUniHzEXTQh6nH_h-l6gJ8nLlzbV6VkkbOhh4F5Y'
};

/**
 * Runtime function to detect test environment with comprehensive checks
 */
const isTestEnvironment = (): boolean => {
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

// Helper function to safely access environment variables
const getEnvVar = (name: string): string | undefined => {
  if (typeof window !== "undefined" || typeof process === "undefined") {
    return undefined;
  }
  return process.env[name];
};

/**
 * Global singleton client instance to prevent multiple GoTrueClient instances
 * Using a Map to store clients per worker with proper locking
 */
const workerClients = new Map<string, SupabaseClient<Database>>();
const workerServiceRoleClients = new Map<string, SupabaseClient<Database>>();
const clientCreationLocks = new Map<string, Promise<void>>();

/**
 * Test Client Factory with True Singleton Pattern
 * Uses a single global Supabase client instance per worker to prevent multiple GoTrueClient warnings
 */
export class TestClientFactory {
  private static currentAuthenticatedUser: string | null = null;
  private static clientInstanceId: string = Math.random().toString(36).substr(2, 9);
  private static workerId: string = getEnvVar('JEST_WORKER_ID') || 'main';
  private static sessionEstablished: boolean = false;
  private static sessionEstablishedAt: number = 0;
  private static readonly SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Ensure we're in a test environment - improved runtime detection
   */
  private static ensureTestEnvironment(): void {
    const isTest = isTestEnvironment();
    
    if (!isTest) {
      console.warn('🔍 TestClientFactory: Environment detection results:');
      console.warn('- Not in an obvious test environment');
      console.warn('- NODE_ENV:', process.env.NODE_ENV);
      console.warn('- CI:', process.env.CI);
      console.warn('- GITHUB_ACTIONS:', process.env.GITHUB_ACTIONS);
      console.warn('- TEST_RUN_ID:', process.env.TEST_RUN_ID);
      console.warn('- JEST_WORKER_ID:', process.env.JEST_WORKER_ID);
      console.warn('⚠️ Proceeding with caution - ensure this is intentional');
    } else {
      console.log(`✅ TestClientFactory: Test environment detected successfully (Worker: ${this.workerId})`);
    }
  }

  /**
   * Wait for session to be fully established with timeout
   */
  private static async waitForSessionEstablished(client: SupabaseClient<Database>, maxAttempts = 10): Promise<boolean> {
    const startTime = Date.now();
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { data: { session }, error } = await client.auth.getSession();
        
        if (error) {
          console.warn(`🔍 Worker ${this.workerId}: Session check ${attempt}/${maxAttempts} failed:`, error.message);
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }
        
        if (session && session.user && session.access_token) {
          console.log(`✅ Worker ${this.workerId}: Session established on attempt ${attempt}/${maxAttempts} - User: ${session.user.email}`);
          this.sessionEstablished = true;
          this.sessionEstablishedAt = Date.now();
          return true;
        }
        
        console.warn(`⚠️ Worker ${this.workerId}: Session not ready ${attempt}/${maxAttempts} - missing session or token`);
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Worker ${this.workerId}: Session check error ${attempt}/${maxAttempts}:`, error);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Check for timeout
      if (Date.now() - startTime > this.SESSION_TIMEOUT_MS) {
        console.error(`❌ Worker ${this.workerId}: Session establishment timed out after ${this.SESSION_TIMEOUT_MS}ms`);
        this.sessionEstablished = false;
        return false;
      }
    }
    
    console.error(`❌ Worker ${this.workerId}: Session establishment failed after ${maxAttempts} attempts`);
    this.sessionEstablished = false;
    return false;
  }

  /**
   * Get the single shared test client for this worker (creates it only once per worker)
   * Uses a lock to prevent race conditions during client creation
   */
  static async getSharedTestClient(): Promise<SupabaseClient<Database>> {
    this.ensureTestEnvironment();

    // Check if we already have a client
    if (workerClients.has(this.workerId)) {
      // Verify session is still valid
      const client = workerClients.get(this.workerId)!;
      const { data: { session } } = await client.auth.getSession();
      
      if (session && session.user && session.access_token) {
        // Check if session is too old
        if (Date.now() - this.sessionEstablishedAt > this.SESSION_TIMEOUT_MS) {
          console.log(`⚠️ Worker ${this.workerId}: Session expired, recreating client`);
          await this.cleanup();
        } else {
          console.log(`🔄 Worker ${this.workerId}: Using existing worker-specific test client (ID: ${this.clientInstanceId})`);
          return client;
        }
      } else {
        console.log(`⚠️ Worker ${this.workerId}: Invalid session, recreating client`);
        await this.cleanup();
      }
    }

    // Create a lock for this worker if one doesn't exist
    if (!clientCreationLocks.has(this.workerId)) {
      clientCreationLocks.set(this.workerId, new Promise<void>(async (resolve) => {
        try {
          console.log(`🔧 Worker ${this.workerId}: Creating worker-specific test client (ID: ${this.clientInstanceId})`);
          
          // Create client only once per worker to prevent multiple GoTrueClient instances
          const client = createClient<Database>(TEST_PROJECT_CONFIG.url, TEST_PROJECT_CONFIG.anonKey, {
            auth: {
              persistSession: true, // Enable persistence within the same worker
              autoRefreshToken: true, // Enable auto-refresh within the same worker
              storageKey: `test_auth_${this.workerId}`, // Unique storage key per worker
            }
          });
          
          workerClients.set(this.workerId, client);
          console.log(`✅ Worker ${this.workerId}: Worker-specific test client created (ID: ${this.clientInstanceId})`);
        } finally {
          resolve();
        }
      }));
    }

    // Wait for the lock to be released
    await clientCreationLocks.get(this.workerId);
    
    // Get the client after creation is complete
    const client = workerClients.get(this.workerId);
    if (!client) {
      throw new Error(`Failed to create test client for worker ${this.workerId}`);
    }
    
    return client;
  }

  /**
   * Authenticate the shared client with specific user credentials
   */
  static async authenticateSharedClient(userEmail: string, userPassword: string): Promise<SupabaseClient<Database>> {
    this.ensureTestEnvironment();

    const client = await this.getSharedTestClient();
    
    // If already authenticated as this user and session is established, verify it's still valid
    if (this.currentAuthenticatedUser === userEmail && this.sessionEstablished) {
      console.log(`🔐 Worker ${this.workerId}: Already authenticated as ${userEmail} on shared client (ID: ${this.clientInstanceId})`);
      
      // Quick session check
      const { data: { session }, error } = await client.auth.getSession();
      if (session && !error && session.user?.email === userEmail && session.access_token) {
        console.log(`✅ Worker ${this.workerId}: Session verified for ${userEmail}`);
        return client;
      } else {
        console.log(`⚠️ Worker ${this.workerId}: Session invalid for ${userEmail}, re-authenticating...`);
        this.currentAuthenticatedUser = null;
        this.sessionEstablished = false;
      }
    }
    
    try {
      // Sign out current user if different
      if (this.currentAuthenticatedUser && this.currentAuthenticatedUser !== userEmail) {
        console.log(`🚪 Worker ${this.workerId}: Signing out ${this.currentAuthenticatedUser} before authenticating ${userEmail}`);
        await client.auth.signOut();
        this.currentAuthenticatedUser = null;
        this.sessionEstablished = false;
        // Give some time for signout to process
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`🔐 Worker ${this.workerId}: Authenticating shared client as ${userEmail} (ID: ${this.clientInstanceId})`);
      
      const { data, error } = await client.auth.signInWithPassword({
        email: userEmail,
        password: userPassword
      });

      if (error) {
        throw new Error(`Failed to authenticate shared client: ${error.message}`);
      }

      if (!data.session || !data.user) {
        throw new Error('Authentication succeeded but no session/user returned');
      }

      this.currentAuthenticatedUser = userEmail;
      console.log(`✅ Worker ${this.workerId}: Shared client authenticated as ${userEmail} (User ID: ${data.user.id})`);
      
      // Wait for session to be fully established
      const sessionReady = await this.waitForSessionEstablished(client);
      if (!sessionReady) {
        throw new Error(`Session establishment failed for ${userEmail}`);
      }
      
      console.log(`🔐 Worker ${this.workerId}: Session established and verified for ${userEmail}`);
      return client;
    } catch (error) {
      console.error(`❌ Worker ${this.workerId}: Failed to authenticate shared client as ${userEmail}:`, error);
      this.currentAuthenticatedUser = null;
      this.sessionEstablished = false;
      throw error;
    }
  }

  /**
   * Get the current authenticated user from the shared client
   */
  static async getCurrentAuthenticatedUser() {
    const client = await this.getSharedTestClient();
    
    console.log(`🔍 Worker ${this.workerId}: Getting current user from shared client (ID: ${this.clientInstanceId})`);
    
    const { data: { session }, error: sessionError } = await client.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error(`Failed to get session from shared client: ${sessionError.message}`);
    }
    
    if (!session) {
      console.error('No active session found on shared client');
      console.log('Current authenticated user tracking:', this.currentAuthenticatedUser);
      console.log('Session established flag:', this.sessionEstablished);
      throw new Error('No active session on shared client');
    }

    console.log(`✅ Worker ${this.workerId}: Found active session for user: ${session.user.email}`);
    return session.user;
  }

  /**
   * Sign out the current user from the shared client
   */
  static async signOutSharedClient(): Promise<void> {
    if (!workerClients.has(this.workerId)) {
      console.log(`🔐 Worker ${this.workerId}: No shared client to sign out from`);
      return;
    }

    try {
      console.log(`🚪 Worker ${this.workerId}: Signing out ${this.currentAuthenticatedUser || 'current user'} from shared client`);
      await workerClients.get(this.workerId)!.auth.signOut();
      this.currentAuthenticatedUser = null;
      this.sessionEstablished = false;
      console.log(`✅ Worker ${this.workerId}: Signed out from shared client`);
    } catch (error) {
      console.error(`❌ Worker ${this.workerId}: Failed to sign out from shared client:`, error);
      this.currentAuthenticatedUser = null;
      this.sessionEstablished = false;
    }
  }

  /**
   * Get service role client for test data setup and cleanup
   */
  static getServiceRoleClient(): SupabaseClient<Database> {
    this.ensureTestEnvironment();

    if (!workerServiceRoleClients.has(this.workerId)) {
      const serviceRoleKey = getEnvVar('TEST_SUPABASE_SERVICE_ROLE_KEY');
      
      if (!serviceRoleKey) {
        console.warn('No service role key found - using shared test client instead');
        return this.getSharedTestClient();
      }

      console.log(`🔧 Worker ${this.workerId}: Creating worker-specific service role client`);
      
      const client = createClient<Database>(TEST_PROJECT_CONFIG.url, serviceRoleKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: `test_service_${this.workerId}`, // Unique storage key per worker
        }
      });

      workerServiceRoleClients.set(this.workerId, client);
    }
    
    return workerServiceRoleClients.get(this.workerId)!;
  }

  /**
   * Get anonymous client for testing application logic
   * Returns the shared client (which may be authenticated)
   */
  static getAnonClient(): SupabaseClient<Database> {
    console.log('🔄 getAnonClient() returning shared test client');
    return this.getSharedTestClient();
  }

  /**
   * Clean up clients and auth state for this worker
   */
  static async cleanup(): Promise<void> {
    try {
      await this.signOutSharedClient();
    } catch (error) {
      console.warn('Cleanup warning during signout:', error);
    }

    // Clear service role client for this worker
    if (workerServiceRoleClients.has(this.workerId)) {
      console.log(`🧹 Worker ${this.workerId}: Clearing worker-specific service role client`);
      workerServiceRoleClients.delete(this.workerId);
    }
    
    // Clear shared client for this worker
    if (workerClients.has(this.workerId)) {
      console.log(`🧹 Worker ${this.workerId}: Clearing worker-specific test client`);
      workerClients.delete(this.workerId);
    }
    
    // Clear creation lock
    clientCreationLocks.delete(this.workerId);
    
    // Reset auth state tracking
    this.currentAuthenticatedUser = null;
    this.sessionEstablished = false;
    this.sessionEstablishedAt = 0;
    
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
    return {
      workerId: this.workerId,
      clientInstanceId: this.clientInstanceId,
      hasSharedClient: workerClients.has(this.workerId),
      hasServiceRoleClient: workerServiceRoleClients.has(this.workerId),
      currentAuthenticatedUser: this.currentAuthenticatedUser,
      sessionEstablished: this.sessionEstablished
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
