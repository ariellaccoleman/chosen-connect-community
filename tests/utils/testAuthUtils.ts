
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { PERSISTENT_TEST_USERS } from './persistentTestUsers';
import { createTestApiClient } from '@/api/core/apiClient';

/**
 * Helper function to add delays between operations to avoid rate limiting
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Test utility to manage authentication context using per-user test clients
 * This ensures we authenticate against the test project with dedicated client instances per user
 */
export class TestAuthUtils {
  /**
   * Set up authentication for a test user using per-user client pattern
   */
  static async setupTestAuth(userKey: keyof typeof PERSISTENT_TEST_USERS = 'user1'): Promise<{ 
    client: any; 
    apiClient: any; 
    user: any; 
  }> {
    try {
      // Get test user credentials
      const testUser = PERSISTENT_TEST_USERS[userKey];
      if (!testUser) {
        throw new Error(`Test user '${userKey}' not found in PERSISTENT_TEST_USERS`);
      }

      console.log(`🔐 Setting up test auth for: ${testUser.email} using per-user client`);
      
      // Add delay before authentication to avoid rate limiting
      await delay(1000);
      
      // Get authenticated client for this specific user
      const authenticatedClient = await TestClientFactory.getUserClient(
        testUser.email, 
        testUser.password
      );

      // Verify the session was set correctly with retries and delays
      await this.verifySessionWithRetries(authenticatedClient, testUser.email);

      // Get the current user from the authenticated client
      const currentUser = await TestClientFactory.getCurrentAuthenticatedUser(testUser.email);

      // Create test API client for this user
      const testApiClient = createTestApiClient(authenticatedClient);

      console.log(`✅ Test auth setup complete for ${userKey} - ready for API operations`);
      
      return {
        client: authenticatedClient,
        apiClient: testApiClient,
        user: currentUser
      };
    } catch (error) {
      console.error('❌ Failed to setup test auth:', error);
      throw error;
    }
  }

  /**
   * Verify session is ready with retries and delays
   */
  private static async verifySessionWithRetries(client: any, userEmail: string, maxAttempts = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { data: { session }, error: sessionError } = await client.auth.getSession();
        
        if (sessionError) {
          console.warn(`⚠️ Session verification attempt ${attempt}/${maxAttempts} failed:`, sessionError.message);
          await delay(2000); // Longer delay on error
          continue;
        }
        
        if (!session) {
          console.warn(`⚠️ No session found on attempt ${attempt}/${maxAttempts}`);
          await delay(1500);
          continue;
        }
        
        if (!session.user || session.user.email !== userEmail) {
          console.warn(`⚠️ Session user mismatch on attempt ${attempt}/${maxAttempts}. Expected: ${userEmail}, Got: ${session.user?.email}`);
          await delay(1500);
          continue;
        }
        
        if (!session.access_token) {
          console.warn(`⚠️ No access token on attempt ${attempt}/${maxAttempts}`);
          await delay(1500);
          continue;
        }
        
        console.log(`✅ Session verified on attempt ${attempt}/${maxAttempts} - User: ${session.user.email}, Token: [${session.access_token.substring(0, 20)}...]`);
        return;
      } catch (error) {
        console.error(`❌ Session verification error on attempt ${attempt}/${maxAttempts}:`, error);
        if (attempt === maxAttempts) {
          throw new Error(`Session verification failed after ${maxAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        await delay(2000); // Longer delay on error
      }
    }
    
    throw new Error(`Session verification failed after ${maxAttempts} attempts`);
  }

  /**
   * Verify current authentication state before API operations
   */
  static async verifyAuthState(client?: any): Promise<{ isAuthenticated: boolean; user: any | null; session: any | null }> {
    try {
      // Add small delay before auth state check
      await delay(100);
      
      const supabaseClient = client || await TestClientFactory.getSharedTestClient();
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      
      if (error) {
        console.error('❌ Auth state verification error:', error);
        return { isAuthenticated: false, user: null, session: null };
      }
      
      const isAuthenticated = !!(session && session.user && session.access_token);
      
      console.log(`🔍 Auth state verification:`, {
        isAuthenticated,
        userEmail: session?.user?.email || 'none',
        hasToken: !!session?.access_token,
        tokenPreview: session?.access_token ? `[${session.access_token.substring(0, 20)}...]` : 'none'
      });
      
      return { isAuthenticated, user: session?.user || null, session };
    } catch (error) {
      console.error('❌ Auth state verification failed:', error);
      return { isAuthenticated: false, user: null, session: null };
    }
  }

  /**
   * Clean up test authentication for specific user
   */
  static async cleanupTestAuth(userEmail?: string): Promise<void> {
    try {
      if (userEmail) {
        console.log(`🧹 Starting test auth cleanup for user: ${userEmail}...`);
        await TestClientFactory.removeUserClient(userEmail);
      } else {
        console.log('🧹 Starting test auth cleanup for all users...');
        await TestClientFactory.clearAllUserClients();
      }
      console.log('✅ Test auth cleanup complete');
    } catch (error) {
      console.error('❌ Failed to cleanup test auth:', error);
      // Don't throw here to avoid masking test failures
    }
  }

  /**
   * Get the current authenticated user from a specific user's client
   * @deprecated Use the user returned from setupTestAuth instead
   */
  static async getCurrentTestUser(userEmail?: string) {
    try {
      if (!userEmail) {
        throw new Error('userEmail is required for getCurrentTestUser in the new per-user client pattern');
      }
      return await TestClientFactory.getCurrentAuthenticatedUser(userEmail);
    } catch (error) {
      throw new Error(`Failed to get current test user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a test client instance
   * @deprecated Use the client returned from setupTestAuth instead
   */
  static getTestClient() {
    console.warn('⚠️ getTestClient() is deprecated. Use the client returned from setupTestAuth() instead.');
    return TestClientFactory.getSharedTestClient();
  }

  /**
   * Execute operation with authentication verification
   */
  static async executeWithAuth<T>(
    operation: () => Promise<T>, 
    description?: string,
    client?: any
  ): Promise<T> {
    const authState = await this.verifyAuthState(client);
    
    if (!authState.isAuthenticated) {
      throw new Error(`Operation "${description || 'unknown'}" requires authentication but user is not authenticated`);
    }
    
    console.log(`🔒 Executing authenticated operation: ${description || 'unknown'}`);
    
    try {
      const result = await operation();
      console.log(`✅ Authenticated operation completed: ${description || 'unknown'}`);
      return result;
    } catch (error) {
      console.error(`❌ Authenticated operation failed: ${description || 'unknown'}`, error);
      
      // If it's an RLS error, provide more debugging info
      if (error instanceof Error && (
        error.message.includes('row-level security') || 
        error.message.includes('PGRST301')
      )) {
        console.error('🚫 RLS Policy Violation - Auth State Debug:', authState);
        console.error('🚫 Client Debug Info:', TestClientFactory.getDebugInfo());
      }
      
      throw error;
    }
  }

  /**
   * Get debug information about the current auth state
   */
  static getDebugInfo() {
    return {
      testClientDebug: TestClientFactory.getDebugInfo(),
      deprecationWarning: 'Some methods are deprecated in favor of per-user client pattern'
    };
  }
}
