
import { TestClientFactory } from '@/integrations/supabase/testClient';

/**
 * Persistent Test Users Configuration
 * 
 * These users should be manually created in your test Supabase project:
 * 1. Go to your test Supabase project Authentication > Users
 * 2. Create these users with email confirmation enabled
 * 3. Set their passwords as specified below
 */
export const PERSISTENT_TEST_USERS = {
  user1: {
    email: 'testuser1@example.com',
    password: 'TestPass123!',
    role: 'basic_user'
  },
  user2: {
    email: 'testuser2@example.com', 
    password: 'TestPass123!',
    role: 'basic_user'
  },
  user3: {
    email: 'testuser3@example.com',
    password: 'TestPass123!',
    role: 'admin_user'
  }
} as const;

/**
 * Helper functions for getting authenticated clients for persistent test users
 */
export class PersistentTestUserHelper {
  
  /**
   * Get authenticated client for test user 1
   */
  static async getUser1Client() {
    return TestClientFactory.createAuthenticatedClient(
      PERSISTENT_TEST_USERS.user1.email,
      PERSISTENT_TEST_USERS.user1.password
    );
  }

  /**
   * Get authenticated client for test user 2
   */
  static async getUser2Client() {
    return TestClientFactory.createAuthenticatedClient(
      PERSISTENT_TEST_USERS.user2.email,
      PERSISTENT_TEST_USERS.user2.password
    );
  }

  /**
   * Get authenticated client for test user 3 (admin)
   */
  static async getUser3Client() {
    return TestClientFactory.createAuthenticatedClient(
      PERSISTENT_TEST_USERS.user3.email,
      PERSISTENT_TEST_USERS.user3.password
    );
  }

  /**
   * Get authenticated client for any user by key
   */
  static async getUserClient(userKey: keyof typeof PERSISTENT_TEST_USERS) {
    const user = PERSISTENT_TEST_USERS[userKey];
    return TestClientFactory.createAuthenticatedClient(user.email, user.password);
  }

  /**
   * Verify that persistent test users are set up correctly
   */
  static async verifyTestUsersSetup(): Promise<boolean> {
    try {
      // Try to authenticate as each user
      for (const [key, user] of Object.entries(PERSISTENT_TEST_USERS)) {
        const client = await TestClientFactory.createAuthenticatedClient(user.email, user.password);
        const { data: { user: authUser }, error } = await client.auth.getUser();
        
        if (error || !authUser) {
          console.error(`❌ Failed to authenticate test user ${key} (${user.email}):`, error?.message);
          return false;
        }
        
        console.log(`✅ Test user ${key} (${user.email}) authenticated successfully`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error verifying test users setup:', error);
      return false;
    }
  }
}
