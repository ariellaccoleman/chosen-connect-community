
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

      // Verify the session was set correctly
      const { data: { session: verifySession }, error: verifyError } = await authenticatedClient.auth.getSession();
      if (verifyError || !verifySession) {
        throw new Error(`Session verification failed on shared client: ${verifyError?.message || 'No session found'}`);
      }

      console.log(`✅ Test auth setup complete for ${userKey} - User ID: ${verifySession.user.id}`);
      console.log(`🔐 Shared client authenticated - all API calls will use this session`);
    } catch (error) {
      console.error('❌ Failed to setup test auth:', error);
      throw error;
    }
  }

  /**
   * Clean up test authentication
   */
  static async cleanupTestAuth(): Promise<void> {
    try {
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
   * Get debug information about the current auth state
   */
  static getDebugInfo() {
    return {
      testClientDebug: TestClientFactory.getDebugInfo(),
      sharedClient: !!TestClientFactory.getSharedTestClient()
    };
  }
}
