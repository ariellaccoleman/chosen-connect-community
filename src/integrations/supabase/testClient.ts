
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use dedicated test project URLs and keys
const TEST_SUPABASE_URL = process.env.TEST_SUPABASE_URL || "https://nvaqqkffmfuxdnwnqhxo.supabase.co";
const TEST_SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52YXFxa2ZmbWZ1eGRud25xaHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNDgxODYsImV4cCI6MjA2MTgyNDE4Nn0.rUwLwOr8QSzhJi3J2Mi_D94Zy-zLWykw7_mXY29UmP4";

// Detect if we're in a Node.js environment (including tests)
const isNodeEnvironment = typeof window === "undefined" && typeof process !== "undefined";

// Helper function to safely access environment variables
const getEnvVar = (name: string): string | undefined => {
  if (!isNodeEnvironment) {
    return undefined;
  }
  return process.env[name];
};

/**
 * Simplified Test Client Factory for dedicated test project
 * No more complex environment detection or schema manipulation needed!
 */
export class TestClientFactory {
  private static serviceRoleClient: SupabaseClient<Database> | null = null;
  private static anonClient: SupabaseClient<Database> | null = null;

  /**
   * Ensure we're in a test environment
   */
  private static ensureTestEnvironment(): void {
    if (!isNodeEnvironment) {
      throw new Error('TestClientFactory can only be used in Node.js/test environments');
    }
  }

  /**
   * Get service role client for test data setup and cleanup
   * Uses the dedicated test project - no security concerns!
   */
  static getServiceRoleClient(): SupabaseClient<Database> {
    this.ensureTestEnvironment();

    if (!this.serviceRoleClient) {
      const serviceRoleKey = getEnvVar('TEST_SUPABASE_SERVICE_ROLE_KEY');
      
      if (!serviceRoleKey) {
        throw new Error('TEST_SUPABASE_SERVICE_ROLE_KEY not found - required for test setup');
      }

      console.log('🔧 Creating service role client for dedicated test project');
      
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
    
    const { data, error } = await client.auth.signInWithPassword({
      email: userEmail,
      password: userPassword
    });

    if (error) {
      throw new Error(`Failed to authenticate test user: ${error.message}`);
    }

    console.log(`🔧 Authenticated test user: ${userEmail}`);
    return client;
  }

  /**
   * Clean up clients
   */
  static cleanup(): void {
    this.serviceRoleClient = null;
    this.anonClient = null;
  }
}

/**
 * Simplified Test Infrastructure - no more complex schema manipulation!
 */
export class TestInfrastructure {
  /**
   * Create test users for authentication testing
   */
  static async createTestUser(email: string, password: string, metadata?: any): Promise<any> {
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
  }

  /**
   * Delete test users
   */
  static async deleteTestUser(userId: string): Promise<void> {
    const serviceClient = TestClientFactory.getServiceRoleClient();
    
    const { error } = await serviceClient.auth.admin.deleteUser(userId);

    if (error) {
      throw new Error(`Failed to delete test user: ${error.message}`);
    }

    console.log(`✅ Deleted test user: ${userId}`);
  }

  /**
   * Clean up test data from tables
   */
  static async cleanupTable(tableName: string): Promise<void> {
    const serviceClient = TestClientFactory.getServiceRoleClient();
    
    // Use service role to bypass RLS for cleanup
    const { error } = await serviceClient
      .from(tableName)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (error) {
      console.warn(`Warning: Could not clean up table ${tableName}:`, error.message);
    } else {
      console.log(`✅ Cleaned up table: ${tableName}`);
    }
  }

  /**
   * Seed test data into a table
   */
  static async seedTable<T>(tableName: string, data: T[]): Promise<void> {
    if (!data || data.length === 0) return;

    const serviceClient = TestClientFactory.getServiceRoleClient();
    
    const { error } = await serviceClient
      .from(tableName)
      .insert(data);

    if (error) {
      throw new Error(`Failed to seed table ${tableName}: ${error.message}`);
    }

    console.log(`✅ Seeded ${data.length} records into ${tableName}`);
  }

  /**
   * Get test project info
   */
  static getTestProjectInfo(): { url: string; usingDedicatedProject: boolean } {
    const testUrl = getEnvVar('TEST_SUPABASE_URL');
    const prodUrl = getEnvVar('SUPABASE_URL');
    
    return {
      url: testUrl || TEST_SUPABASE_URL,
      usingDedicatedProject: testUrl !== prodUrl && !!testUrl
    };
  }
}
