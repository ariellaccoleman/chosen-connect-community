
import { supabase } from '@/integrations/supabase/client';
import { PersistentTestUserHelper } from './persistentTestUsers';

/**
 * Test utility to manage authentication context for the main Supabase client
 * This allows tests to use the same code path as production while ensuring proper authentication
 */
export class TestAuthUtils {
  private static originalSession: any = null;

  /**
   * Set up authentication for a test user on the main Supabase client
   * This temporarily authenticates the main client as a test user
   */
  static async setupTestAuth(userKey: keyof typeof import('./persistentTestUsers').PERSISTENT_TEST_USERS = 'user1'): Promise<void> {
    try {
      // Get the current session to restore later
      const { data: { session } } = await supabase.auth.getSession();
      this.originalSession = session;

      // Get authenticated client for the test user
      const testClient = await PersistentTestUserHelper.getUserClient(userKey);
      const { data: { session: testSession }, error } = await testClient.auth.getSession();
      
      if (error || !testSession) {
        throw new Error(`Failed to get test session: ${error?.message}`);
      }

      // Set the session on the main client
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: testSession.access_token,
        refresh_token: testSession.refresh_token
      });

      if (setSessionError) {
        throw new Error(`Failed to set session: ${setSessionError.message}`);
      }

      // Verify the session was set correctly
      const { data: { session: verifySession }, error: verifyError } = await supabase.auth.getSession();
      if (verifyError || !verifySession) {
        throw new Error(`Session verification failed: ${verifyError?.message || 'No session found'}`);
      }

      console.log(`✅ Test auth setup complete for ${userKey} - User ID: ${verifySession.user.id}`);
    } catch (error) {
      console.error('❌ Failed to setup test auth:', error);
      throw error;
    }
  }

  /**
   * Clean up test authentication and restore original state
   */
  static async cleanupTestAuth(): Promise<void> {
    try {
      if (this.originalSession) {
        // Restore original session
        await supabase.auth.setSession({
          access_token: this.originalSession.access_token,
          refresh_token: this.originalSession.refresh_token
        });
      } else {
        // Sign out if there was no original session
        await supabase.auth.signOut();
      }

      this.originalSession = null;
      console.log('✅ Test auth cleanup complete');
    } catch (error) {
      console.error('❌ Failed to cleanup test auth:', error);
      // Don't throw here to avoid masking test failures
    }
  }

  /**
   * Get the current authenticated user from the main client
   */
  static async getCurrentTestUser() {
    // First verify we have a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw new Error(`Failed to get session: ${sessionError.message}`);
    }
    
    if (!session) {
      throw new Error('Auth session missing!');
    }

    // Then get the user
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      throw new Error(`Failed to get current user: ${error.message}`);
    }
    
    if (!user) {
      throw new Error('User not found in session!');
    }
    
    return user;
  }
}
