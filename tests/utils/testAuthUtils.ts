
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { PERSISTENT_TEST_USERS } from './persistentTestUsers';

/**
 * Test utility to manage authentication context using the test Supabase client
 * This ensures we authenticate against the test project, not production
 */
export class TestAuthUtils {
  /**
   * Set up authentication for a test user using the test Supabase client singleton
   */
  static async setupTestAuth(userKey: keyof typeof PERSISTENT_TEST_USERS = 'user1'): Promise<void> {
    try {
      // Get test user credentials
      const testUser = PERSISTENT_TEST_USERS[userKey];
      if (!testUser) {
        throw new Error(`Test user '${userKey}' not found in PERSISTENT_TEST_USERS`);
      }

      console.log(`🔐 Signing in test user: ${testUser.email} on test project`);
      
      // Create and store authenticated client as singleton
      const authenticatedClient = await TestClientFactory.createAuthenticatedClient(
        testUser.email, 
        testUser.password
      );

      // Verify the session was set correctly
      const { data: { session: verifySession }, error: verifyError } = await authenticatedClient.auth.getSession();
      if (verifyError || !verifySession) {
        throw new Error(`Session verification failed on test client: ${verifyError?.message || 'No session found'}`);
      }

      console.log(`✅ Test auth setup complete for ${userKey} on test project - User ID: ${verifySession.user.id}`);
      console.log(`🔐 Authenticated client set as singleton - all API calls will use this session`);
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
      const authenticatedClient = TestClientFactory.getAuthenticatedTestClient();
      if (authenticatedClient) {
        await authenticatedClient.auth.signOut();
      }
      TestClientFactory.clearAuthenticatedTestClient();
      console.log('✅ Test auth cleanup complete');
    } catch (error) {
      console.error('❌ Failed to cleanup test auth:', error);
      // Don't throw here to avoid masking test failures
    }
  }

  /**
   * Get the current authenticated user from the singleton test client
   */
  static async getCurrentTestUser() {
    const authenticatedClient = TestClientFactory.getAuthenticatedTestClient();
    if (!authenticatedClient) {
      throw new Error('Authenticated test client not initialized - call setupTestAuth first');
    }

    // First verify we have a session
    const { data: { session }, error: sessionError } = await authenticatedClient.auth.getSession();
    if (sessionError) {
      throw new Error(`Failed to get session from authenticated test client: ${sessionError.message}`);
    }
    
    if (!session) {
      throw new Error('Auth session missing on authenticated test client!');
    }

    // Then get the user
    const { data: { user }, error } = await authenticatedClient.auth.getUser();
    if (error) {
      throw new Error(`Failed to get current user from authenticated test client: ${error.message}`);
    }
    
    if (!user) {
      throw new Error('User not found in authenticated test client session!');
    }
    
    return user;
  }

  /**
   * Get the singleton authenticated test client instance
   */
  static getTestClient() {
    const authenticatedClient = TestClientFactory.getAuthenticatedTestClient();
    if (!authenticatedClient) {
      throw new Error('Authenticated test client not initialized - call setupTestAuth first');
    }
    return authenticatedClient;
  }
}
