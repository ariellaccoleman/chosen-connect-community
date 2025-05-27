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
 * Test Client Factory with Single Shared Client Pattern
 * Uses one Supabase client instance shared across all test operations
 */
export class TestClientFactory {
  private static serviceRoleClient: SupabaseClient<Database> | null = null;
  private static sharedTestClient: SupabaseClient<Database> | null = null;
  private static currentAuthenticatedUser: string | null = null;
  private static clientInstanceId: string = Math.random().toString(36).substr(2, 9);

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
      console.log('✅ TestClientFactory: Test environment detected successfully');
    }
  }

  /**
   * Get the single shared test client (creates it if needed)
   */
  static getSharedTestClient(): SupabaseClient<Database> {
    this.ensureTestEnvironment();

    if (!this.sharedTestClient) {
      console.log(`🔧 Creating shared test client (ID: ${this.clientInstanceId})`);
      
      // Create a simple client without complex session management for now
      this.sharedTestClient = createClient<Database>(TEST_PROJECT_CONFIG.url, TEST_PROJECT_CONFIG.anonKey, {
        auth: {
          persistSession: false, // Disable persistence to avoid session conflicts
          autoRefreshToken: false, // Disable auto-refresh during tests
        }
      });
      
      console.log(`✅ Shared test client created (ID: ${this.clientInstanceId})`);
    } else {
      console.log(`🔄 Using existing shared test client (ID: ${this.clientInstanceId})`);
    }
    
    return this.sharedTestClient;
  }

  /**
   * Authenticate the shared client with specific user credentials
   */
  static async authenticateSharedClient(userEmail: string, userPassword: string): Promise<SupabaseClient<Database>> {
    this.ensureTestEnvironment();

    const client = this.getSharedTestClient();
    
    // If already authenticated as this user, verify session is still valid
    if (this.currentAuthenticatedUser === userEmail) {
      console.log(`🔐 Already authenticated as ${userEmail} on shared client (ID: ${this.clientInstanceId})`);
      
      // Quick session check
      const { data: { session }, error } = await client.auth.getSession();
      if (session && !error && session.user?.email === userEmail) {
        console.log(`✅ Session verified for ${userEmail}`);
        return client;
      } else {
        console.log(`⚠️ Session invalid for ${userEmail}, re-authenticating...`);
        this.currentAuthenticatedUser = null;
      }
    }
    
    try {
      // Sign out current user if different
      if (this.currentAuthenticatedUser && this.currentAuthenticatedUser !== userEmail) {
        console.log(`🚪 Signing out ${this.currentAuthenticatedUser} before authenticating ${userEmail}`);
        await client.auth.signOut();
        this.currentAuthenticatedUser = null;
      }

      console.log(`🔐 Authenticating shared client as ${userEmail} (ID: ${this.clientInstanceId})`);
      
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
      console.log(`✅ Shared client authenticated as ${userEmail} (User ID: ${data.user.id})`);
      
      // Immediate session verification
      const { data: { session: verifySession }, error: verifyError } = await client.auth.getSession();
      if (verifyError || !verifySession) {
        console.error('Session verification failed immediately after auth:', verifyError);
        throw new Error(`Session verification failed: ${verifyError?.message || 'No session found'}`);
      }
      
      console.log(`🔐 Session verified and active for ${userEmail}`);
      return client;
    } catch (error) {
      console.error(`❌ Failed to authenticate shared client as ${userEmail}:`, error);
      this.currentAuthenticatedUser = null;
      throw error;
    }
  }

  /**
   * Get the current authenticated user from the shared client
   */
  static async getCurrentAuthenticatedUser() {
    const client = this.getSharedTestClient();
    
    console.log(`🔍 Getting current user from shared client (ID: ${this.clientInstanceId})`);
    
    const { data: { session }, error: sessionError } = await client.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error(`Failed to get session from shared client: ${sessionError.message}`);
    }
    
    if (!session) {
      console.error('No active session found on shared client');
      console.log('Current authenticated user tracking:', this.currentAuthenticatedUser);
      throw new Error('No active session on shared client');
    }

    console.log(`✅ Found active session for user: ${session.user.email}`);
    return session.user;
  }

  /**
   * Sign out the current user from the shared client
   */
  static async signOutSharedClient(): Promise<void> {
    if (!this.sharedTestClient) {
      console.log('🔐 No shared client to sign out from');
      return;
    }

    try {
      console.log(`🚪 Signing out ${this.currentAuthenticatedUser || 'current user'} from shared client`);
      await this.sharedTestClient.auth.signOut();
      this.currentAuthenticatedUser = null;
      console.log('✅ Signed out from shared client');
    } catch (error) {
      console.error('❌ Failed to sign out from shared client:', error);
      this.currentAuthenticatedUser = null;
    }
  }

  /**
   * Get service role client for test data setup and cleanup
   */
  static getServiceRoleClient(): SupabaseClient<Database> {
    this.ensureTestEnvironment();

    if (!this.serviceRoleClient) {
      const serviceRoleKey = getEnvVar('TEST_SUPABASE_SERVICE_ROLE_KEY');
      
      if (!serviceRoleKey) {
        console.warn('No service role key found - using shared test client instead');
        return this.getSharedTestClient();
      }

      console.log('🔧 Creating service role client for test project');
      
      this.serviceRoleClient = createClient<Database>(TEST_PROJECT_CONFIG.url, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      });
    }
    
    return this.serviceRoleClient;
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
   * Clean up clients and auth state
   */
  static async cleanup(): Promise<void> {
    try {
      await this.signOutSharedClient();
    } catch (error) {
      console.warn('Cleanup warning during signout:', error);
    }

    if (this.serviceRoleClient) {
      this.serviceRoleClient = null;
    }
    
    if (this.sharedTestClient) {
      console.log(`🧹 Clearing shared test client (ID: ${this.clientInstanceId})`);
      this.sharedTestClient = null;
    }
    
    this.currentAuthenticatedUser = null;
    console.log('✅ TestClientFactory cleanup complete');
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
      clientInstanceId: this.clientInstanceId,
      hasSharedClient: !!this.sharedTestClient,
      hasServiceRoleClient: !!this.serviceRoleClient,
      currentAuthenticatedUser: this.currentAuthenticatedUser
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
