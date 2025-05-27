
import { TestClientFactory } from '@/integrations/supabase/testClient';

/**
 * Centralized test user credentials configuration
 */
export const TEST_USER_CONFIG = {
  password: 'TestPass123!',
  emailDomain: '@example.com',
  role: 'basic_user'
} as const;

/**
 * Test user email addresses
 */
export const TEST_USER_EMAILS = {
  user1: 'testuser4@example.com',
  user2: 'testuser5@example.com', 
  user3: 'testuser6@example.com'
} as const;

/**
 * Persistent Test Users Configuration
 * 
 * These users should be manually created in your test Supabase project:
 * 1. Go to your test Supabase project Authentication > Users
 * 2. Create these users with email confirmation enabled
 * 3. Set their passwords as specified in TEST_USER_CONFIG
 */
export const PERSISTENT_TEST_USERS = {
  user1: {
    email: TEST_USER_EMAILS.user1,
    password: TEST_USER_CONFIG.password,
    role: TEST_USER_CONFIG.role,
    displayName: 'Test User4'
  },
  user2: {
    email: TEST_USER_EMAILS.user2,
    password: TEST_USER_CONFIG.password,
    role: TEST_USER_CONFIG.role,
    displayName: 'Test User5'
  },
  user3: {
    email: TEST_USER_EMAILS.user3,
    password: TEST_USER_CONFIG.password,
    role: TEST_USER_CONFIG.role,
    displayName: 'Test User6'
  }
} as const;

/**
 * Helper functions for getting authenticated clients for persistent test users
 */
export class PersistentTestUserHelper {
  
  /**
   * Get authenticated client for test user 1 (Test User4)
   */
  static async getUser1Client() {
    return TestClientFactory.createAuthenticatedClient(
      PERSISTENT_TEST_USERS.user1.email,
      PERSISTENT_TEST_USERS.user1.password
    );
  }

  /**
   * Get authenticated client for test user 2 (Test User5)
   */
  static async getUser2Client() {
    return TestClientFactory.createAuthenticatedClient(
      PERSISTENT_TEST_USERS.user2.email,
      PERSISTENT_TEST_USERS.user2.password
    );
  }

  /**
   * Get authenticated client for test user 3 (Test User6)
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
        
        console.log(`✅ Test user ${key} (${user.displayName} - ${user.email}) authenticated successfully`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error verifying test users setup:', error);
      return false;
    }
  }

  /**
   * Get all test user emails for bulk operations
   */
  static getAllTestUserEmails(): string[] {
    return Object.values(TEST_USER_EMAILS);
  }

  /**
   * Get the standard test password
   */
  static getTestPassword(): string {
    return TEST_USER_CONFIG.password;
  }
}
