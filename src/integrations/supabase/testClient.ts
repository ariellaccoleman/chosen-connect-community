
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

// Test configuration
const TEST_USER_CONFIG = {
  password: 'TestPass123!'
};

// Get environment variables with better error handling
const getTestEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required test environment variable: ${name}. Ensure your test environment is properly configured.`);
  }
  return value;
};

/**
 * Test Client Factory for managing Supabase clients in test environments
 * 
 * This factory provides different types of clients for various testing scenarios:
 * - Shared Test Client: Authenticated client for most integration tests
 * - Fresh Test Client: Clean client for authentication testing
 * - Service Role Client: Admin client for test setup/cleanup
 */
export class TestClientFactory {
  private static sharedTestClient: SupabaseClient<Database> | null = null;
  private static serviceRoleClient: SupabaseClient<Database> | null = null;
  private static isInitialized = false;

  /**
   * Initialize the test environment
   */
  private static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const testUrl = getTestEnvVar('VITE_SUPABASE_URL');
      const testKey = getTestEnvVar('VITE_SUPABASE_ANON_KEY');
      
      console.log('🔧 Initializing test clients...');
      console.log(`📍 Test URL: ${testUrl}`);
      console.log(`🔑 Test Key: ${testKey.substring(0, 20)}...`);

      // Create shared test client
      this.sharedTestClient = createClient<Database>(testUrl, testKey, {
        auth: {
          storage: {
            getItem: (key) => null, // Start fresh
            setItem: (key, value) => {},
            removeItem: (key) => {}
          },
          persistSession: false, // Don't persist for tests
          autoRefreshToken: true,
        }
      });

      // Create service role client for admin operations
      const serviceRoleKey = getTestEnvVar('SUPABASE_SERVICE_ROLE_KEY');
      this.serviceRoleClient = createClient<Database>(testUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      });

      this.isInitialized = true;
      console.log('✅ Test clients initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize test clients:', error);
      throw error;
    }
  }

  /**
   * Get a fresh, unauthenticated test client for authentication testing
   * This client has no existing session and can be used to test login/signup flows
   */
  static getFreshTestClient(): SupabaseClient<Database> {
    const testUrl = getTestEnvVar('VITE_SUPABASE_URL');
    const testKey = getTestEnvVar('VITE_SUPABASE_ANON_KEY');

    console.log('🆕 Creating fresh test client for authentication testing');
    
    return createClient<Database>(testUrl, testKey, {
      auth: {
        storage: {
          getItem: (key) => null, // Always start fresh
          setItem: (key, value) => {},
          removeItem: (key) => {}
        },
        persistSession: false,
        autoRefreshToken: true,
      }
    });
  }

  /**
   * Get the shared test client (creates if needed)
   */
  static async getSharedTestClient(): Promise<SupabaseClient<Database>> {
    await this.initialize();
    if (!this.sharedTestClient) {
      throw new Error('Shared test client not initialized');
    }
    return this.sharedTestClient;
  }

  /**
   * Get client synchronously (for contexts where async is not possible)
   */
  static getSharedTestClient(): SupabaseClient<Database> {
    if (!this.sharedTestClient) {
      // Initialize synchronously for immediate access
      const testUrl = getTestEnvVar('VITE_SUPABASE_URL');
      const testKey = getTestEnvVar('VITE_SUPABASE_ANON_KEY');
      
      this.sharedTestClient = createClient<Database>(testUrl, testKey, {
        auth: {
          storage: {
            getItem: (key) => null,
            setItem: (key, value) => {},
            removeItem: (key) => {}
          },
          persistSession: false,
          autoRefreshToken: true,
        }
      });
    }
    return this.sharedTestClient;
  }

  /**
   * Get the service role client for admin operations
   */
  static getServiceRoleClient(): SupabaseClient<Database> {
    try {
      if (!this.serviceRoleClient) {
        const testUrl = getTestEnvVar('VITE_SUPABASE_URL');
        const serviceRoleKey = getTestEnvVar('SUPABASE_SERVICE_ROLE_KEY');
        
        this.serviceRoleClient = createClient<Database>(testUrl, serviceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          }
        });
      }
      return this.serviceRoleClient;
    } catch (error) {
      console.error('❌ Failed to get service role client:', error);
      throw error;
    }
  }

  /**
   * Authenticate the shared test client with specific user credentials
   */
  static async authenticateSharedClient(email: string, password: string): Promise<SupabaseClient<Database>> {
    console.log(`🔐 Authenticating shared client: ${email}`);
    
    const client = this.getSharedTestClient();
    
    // Clear any existing session first
    await client.auth.signOut();
    
    // Sign in with provided credentials
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error(`❌ Authentication failed for ${email}:`, error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
    
    if (!data.session) {
      throw new Error('Authentication succeeded but no session was created');
    }
    
    console.log(`✅ Shared client authenticated: ${email}`);
    return client;
  }

  /**
   * Sign out the shared test client
   */
  static async signOutSharedClient(): Promise<void> {
    if (this.sharedTestClient) {
      console.log('🚪 Signing out shared test client...');
      await this.sharedTestClient.auth.signOut();
      console.log('✅ Shared test client signed out');
    }
  }

  /**
   * Get the current authenticated user from the shared client
   */
  static async getCurrentAuthenticatedUser() {
    const client = this.getSharedTestClient();
    const { data: { session }, error } = await client.auth.getSession();
    
    if (error) {
      throw new Error(`Failed to get session: ${error.message}`);
    }
    
    if (!session?.user) {
      throw new Error('No authenticated user found');
    }
    
    return session.user;
  }

  /**
   * Clean up all test clients
   */
  static cleanup(): void {
    console.log('🧹 Cleaning up test clients...');
    
    if (this.sharedTestClient) {
      // Sign out shared client
      this.sharedTestClient.auth.signOut().catch(console.warn);
      this.sharedTestClient = null;
    }
    
    if (this.serviceRoleClient) {
      this.serviceRoleClient = null;
    }
    
    this.isInitialized = false;
    console.log('✅ Test clients cleaned up');
  }

  /**
   * Get debug information about the current state
   */
  static getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      hasSharedClient: !!this.sharedTestClient,
      hasServiceClient: !!this.serviceRoleClient,
      testConfig: {
        hasUrl: !!process.env.VITE_SUPABASE_URL,
        hasAnonKey: !!process.env.VITE_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    };
  }
}
