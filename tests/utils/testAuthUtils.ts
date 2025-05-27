
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { PERSISTENT_TEST_USERS } from './persistentTestUsers';

/**
 * Test utility to manage authentication context using the shared test client
 * This ensures we authenticate against the test project with a single client instance
 */
export class TestAuthUtils {
  /**
   * Set up authentication for a test user using the shared test client
   */
  static async setupTestAuth(userKey: keyof typeof PERSISTENT_TEST_USERS = 'user1'): Promise<void> {
    try {
      // Get test user credentials
      const testUser = PERSISTENT_TEST_USERS[userKey];
      if (!testUser) {
        throw new Error(`Test user '${userKey}' not found in PERSISTENT_TEST_USERS`);
      }

      console.log(`🔐 Setting up test auth for: ${testUser.email} using shared client`);
      
      // Authenticate the shared client
      const authenticatedClient = await TestClientFactory.authenticateSharedClient(
        testUser.email, 
        testUser.password
      );

      // Verify the session was set correctly with retries
      await this.verifySessionWithRetries(authenticatedClient, testUser.email);

      console.log(`✅ Test auth setup complete for ${userKey} - ready for API operations`);
    } catch (error) {
      console.error('❌ Failed to setup test auth:', error);
      throw error;
    }
  }

  /**
   * Verify session is ready with retries
   */
  private static async verifySessionWithRetries(client: any, userEmail: string, maxAttempts = 5): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { data: { session }, error: sessionError } = await client.auth.getSession();
        
        if (sessionError) {
          console.warn(`⚠️ Session verification attempt ${attempt}/${maxAttempts} failed:`, sessionError.message);
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }
        
        if (!session) {
          console.warn(`⚠️ No session found on attempt ${attempt}/${maxAttempts}`);
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }
        
        if (!session.user || session.user.email !== userEmail) {
          console.warn(`⚠️ Session user mismatch on attempt ${attempt}/${maxAttempts}. Expected: ${userEmail}, Got: ${session.user?.email}`);
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }
        
        if (!session.access_token) {
          console.warn(`⚠️ No access token on attempt ${attempt}/${maxAttempts}`);
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }
        
        console.log(`✅ Session verified on attempt ${attempt}/${maxAttempts} - User: ${session.user.email}, Token: [${session.access_token.substring(0, 20)}...]`);
        return;
      } catch (error) {
        console.error(`❌ Session verification error on attempt ${attempt}/${maxAttempts}:`, error);
        if (attempt === maxAttempts) {
          throw new Error(`Session verification failed after ${maxAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    throw new Error(`Session verification failed after ${maxAttempts} attempts`);
  }

  /**
   * Verify current authentication state before API operations
   */
  static async verifyAuthState(): Promise<{ isAuthenticated: boolean; user: any | null; session: any | null }> {
    try {
      const client = TestClientFactory.getSharedTestClient();
      const { data: { session }, error } = await client.auth.getSession();
      
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
   * Clean up test authentication
   */
  static async cleanupTestAuth(): Promise<void> {
    try {
      console.log('🧹 Starting test auth cleanup...');
      await TestClientFactory.signOutSharedClient();
      console.log('✅ Test auth cleanup complete');
    } catch (error) {
      console.error('❌ Failed to cleanup test auth:', error);
      // Don't throw here to avoid masking test failures
    }
  }

  /**
   * Get the current authenticated user from the shared test client
   */
  static async getCurrentTestUser() {
    try {
      return await TestClientFactory.getCurrentAuthenticatedUser();
    } catch (error) {
      throw new Error(`Failed to get current test user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the shared test client instance
   */
  static getTestClient() {
    return TestClientFactory.getSharedTestClient();
  }

  /**
   * Execute operation with authentication verification
   */
  static async executeWithAuth<T>(operation: () => Promise<T>, description?: string): Promise<T> {
    const authState = await this.verifyAuthState();
    
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
      sharedClient: !!TestClientFactory.getSharedTestClient()
    };
  }
}
