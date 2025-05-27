
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { PERSISTENT_TEST_USERS } from './persistentTestUsers';

/**
 * Test utility to manage authentication context using the test Supabase client
 * This ensures we authenticate against the test project, not production
 */
export class TestAuthUtils {
  private static testClient: any = null;

  /**
   * Set up authentication for a test user using the test Supabase client
   */
  static async setupTestAuth(userKey: keyof typeof PERSISTENT_TEST_USERS = 'user1'): Promise<void> {
    try {
      // Get test user credentials
      const testUser = PERSISTENT_TEST_USERS[userKey];
      if (!testUser) {
        throw new Error(`Test user '${userKey}' not found in PERSISTENT_TEST_USERS`);
      }

      console.log(`🔐 Signing in test user: ${testUser.email} on test project`);
      
      // Use the test client factory to get an authenticated client
      this.testClient = await TestClientFactory.createAuthenticatedClient(
        testUser.email, 
        testUser.password
      );

      // Verify the session was set correctly on the test client
      const { data: { session: verifySession }, error: verifyError } = await this.testClient.auth.getSession();
      if (verifyError || !verifySession) {
        throw new Error(`Session verification failed on test client: ${verifyError?.message || 'No session found'}`);
      }

      console.log(`✅ Test auth setup complete for ${userKey} on test project - User ID: ${verifySession.user.id}`);
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
      if (this.testClient) {
        await this.testClient.auth.signOut();
        this.testClient = null;
      }
      console.log('✅ Test auth cleanup complete');
    } catch (error) {
      console.error('❌ Failed to cleanup test auth:', error);
      // Don't throw here to avoid masking test failures
    }
  }

  /**
   * Get the current authenticated user from the test client
   */
  static async getCurrentTestUser() {
    if (!this.testClient) {
      throw new Error('Test client not initialized - call setupTestAuth first');
    }

    // First verify we have a session on the test client
    const { data: { session }, error: sessionError } = await this.testClient.auth.getSession();
    if (sessionError) {
      throw new Error(`Failed to get session from test client: ${sessionError.message}`);
    }
    
    if (!session) {
      throw new Error('Auth session missing on test client!');
    }

    // Then get the user from the test client
    const { data: { user }, error } = await this.testClient.auth.getUser();
    if (error) {
      throw new Error(`Failed to get current user from test client: ${error.message}`);
    }
    
    if (!user) {
      throw new Error('User not found in test client session!');
    }
    
    return user;
  }

  /**
   * Get the test client instance (for advanced use cases)
   */
  static getTestClient() {
    if (!this.testClient) {
      throw new Error('Test client not initialized - call setupTestAuth first');
    }
    return this.testClient;
  }
}
