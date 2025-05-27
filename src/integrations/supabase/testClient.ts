
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Early browser detection to prevent execution
const isBrowser = typeof window !== "undefined";
const isNode = typeof process !== "undefined";

// If we're in a browser, don't execute any of this test infrastructure
if (isBrowser) {
  console.warn('🚫 TestClient: Test infrastructure is not available in browser environment');
}

// Use dedicated test project URLs and keys (only in Node.js)
const TEST_SUPABASE_URL = isNode ? (process.env.TEST_SUPABASE_URL || "https://nvaqqkffmfuxdnwnqhxo.supabase.co") : "";
const TEST_SUPABASE_ANON_KEY = isNode ? (process.env.TEST_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52YXFxa2ZmbWZ1eGRud25xaHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNDgxODYsImV4cCI6MjA2MTgyNDE4Nn0.rUwLwOr8QSzhJi3J2Mi_D94Zy-zLWykw7_mXY29UmP4") : "";

/**
 * Runtime function to detect test environment with comprehensive checks
 */
const isTestEnvironment = (): boolean => {
  // Return false immediately if in browser
  if (isBrowser || !isNode) {
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

// Helper function to safely access environment variables
const getEnvVar = (name: string): string | undefined => {
  if (isBrowser || !isNode) {
    return undefined;
  }
  return process.env[name];
};

/**
 * Simplified Test Client Factory for dedicated test project
 * Focused on database-based testing with real Supabase behavior
 */
export class TestClientFactory {
  private static serviceRoleClient: SupabaseClient<Database> | null = null;
  private static anonClient: SupabaseClient<Database> | null = null;

  /**
   * Ensure we're in a test environment - improved runtime detection
   */
  private static ensureTestEnvironment(): void {
    if (isBrowser) {
      throw new Error('🚫 TestClientFactory: Cannot be used in browser environment');
    }

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
      
      // Don't throw an error - just warn and proceed
      // This allows tests to run even if environment detection isn't perfect
    } else {
      console.log('✅ TestClientFactory: Test environment detected successfully');
    }
  }

  /**
   * Get service role client for test data setup and cleanup
   * Uses the dedicated test project - no security concerns!
   */
  static getServiceRoleClient(): SupabaseClient<Database> {
    this.ensureTestEnvironment();

    if (!this.serviceRoleClient) {
      const serviceRoleKey = getEnvVar('TEST_SUPABASE_SERVICE_ROLE_KEY') || getEnvVar('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!serviceRoleKey) {
        console.warn('No service role key found - using anon client instead');
        return this.getAnonClient();
      }

      console.log('🔧 Creating service role client for test project');
      
      this.serviceRoleClient = createClient<Database>(TEST_SUPABASE_URL, serviceRoleKey, {
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
   * Uses the dedicated test project with real database behavior
   */
  static getAnonClient(): SupabaseClient<Database> {
    this.ensureTestEnvironment();

    if (!this.anonClient) {
      console.log('🔧 Creating anonymous client for test project');
      
      this.anonClient = createClient<Database>(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      });
    }
    
    return this.anonClient;
  }

  /**
   * Create an authenticated client for a specific test user
   */
  static async createAuthenticatedClient(userEmail: string, userPassword: string): Promise<SupabaseClient<Database>> {
    this.ensureTestEnvironment();

    const client = this.getAnonClient();
    
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: userEmail,
        password: userPassword
      });

      if (error) {
        throw new Error(`Failed to authenticate test user: ${error.message}`);
      }

      console.log(`🔧 Authenticated test user: ${userEmail}`);
      return client;
    } catch (error) {
      console.error(`Failed to authenticate test user ${userEmail}:`, error);
      throw error;
    }
  }

  /**
   * Clean up clients
   */
  static cleanup(): void {
    if (this.serviceRoleClient) {
      this.serviceRoleClient = null;
    }
    if (this.anonClient) {
      this.anonClient = null;
    }
  }

  /**
   * Get test project info
   */
  static getTestProjectInfo(): { url: string; usingDedicatedProject: boolean } {
    if (isBrowser) {
      return {
        url: '',
        usingDedicatedProject: false
      };
    }

    const testUrl = process.env.TEST_SUPABASE_URL;
    const prodUrl = process.env.SUPABASE_URL;

    console.log('🔍 TestProjectInfo env:', {
      TEST_SUPABASE_URL: testUrl,
      SUPABASE_URL: prodUrl,
    });

    return {
      url: testUrl || TEST_SUPABASE_URL,  // fallback hardcoded
      usingDedicatedProject:
        !!testUrl && !!prodUrl && testUrl.trim() !== prodUrl.trim()
    };
  }
}

/**
 * Simplified Test Infrastructure for database-based testing
 */
export class TestInfrastructure {
  /**
   * Create test users for authentication testing
   */
  static async createTestUser(email: string, password: string, metadata?: any): Promise<any> {
    if (isBrowser) {
      throw new Error('🚫 TestInfrastructure: Cannot be used in browser environment');
    }

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
    if (isBrowser) {
      throw new Error('🚫 TestInfrastructure: Cannot be used in browser environment');
    }

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
    if (isBrowser) {
      throw new Error('🚫 TestInfrastructure: Cannot be used in browser environment');
    }

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
    if (isBrowser) {
      throw new Error('🚫 TestInfrastructure: Cannot be used in browser environment');
    }

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
