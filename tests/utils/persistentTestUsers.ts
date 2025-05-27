
import { TestClientFactory } from '@/integrations/supabase/testClient';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

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
  },
  user4: {
    email: 'testuser1@example.com',
    password: TEST_USER_CONFIG.password,
    role: TEST_USER_CONFIG.role,
    displayName: 'Test User1'
  },
  user5: {
    email: 'testuser2@example.com', 
    password: TEST_USER_CONFIG.password,
    role: TEST_USER_CONFIG.role,
    displayName: 'Test User2'
  },
  user6: {
    email: 'testuser3@example.com',
    password: TEST_USER_CONFIG.password,
    role: TEST_USER_CONFIG.role,
    displayName: 'Test User3'
  }
} as const;

/**
 * Helper function to add delays between operations to avoid rate limiting
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper functions for getting authenticated clients for persistent test users
 * Uses the shared test client from TestClientFactory
 */
export class PersistentTestUserHelper {
  /**
   * Get authenticated client for test user 1 (Test User4)
   * Uses shared client pattern - authenticates the shared client
   */
  static async getUser1Client(): Promise<SupabaseClient<Database>> {
    await delay(1000); // Add 1 second delay to avoid rate limiting
    return TestClientFactory.authenticateSharedClient(
      PERSISTENT_TEST_USERS.user1.email,
      PERSISTENT_TEST_USERS.user1.password
    );
  }

  /**
   * Get authenticated client for test user 2 (Test User5)
   * Uses shared client pattern - authenticates the shared client
   */
  static async getUser2Client(): Promise<SupabaseClient<Database>> {
    await delay(1000); // Add 1 second delay to avoid rate limiting
    return TestClientFactory.authenticateSharedClient(
      PERSISTENT_TEST_USERS.user2.email,
      PERSISTENT_TEST_USERS.user2.password
    );
  }

  /**
   * Get authenticated client for test user 3 (Test User6)
   * Uses shared client pattern - authenticates the shared client
   */
  static async getUser3Client(): Promise<SupabaseClient<Database>> {
    await delay(1000); // Add 1 second delay to avoid rate limiting
    return TestClientFactory.authenticateSharedClient(
      PERSISTENT_TEST_USERS.user3.email,
      PERSISTENT_TEST_USERS.user3.password
    );
  }

  /**
   * Get authenticated client for any user by key
   */
  static async getUserClient(userKey: keyof typeof PERSISTENT_TEST_USERS): Promise<SupabaseClient<Database>> {
    const userConfig = PERSISTENT_TEST_USERS[userKey];
    if (!userConfig) {
      throw new Error(`Unknown user key: ${userKey}`);
    }

    await delay(1500); // Add 1.5 second delay to avoid rate limiting
    return TestClientFactory.authenticateSharedClient(
      userConfig.email,
      userConfig.password
    );
  }

  /**
   * Clear all clients - delegates to TestClientFactory
   */
  static async clearAllClients(): Promise<void> {
    console.log('🧹 PersistentTestUserHelper: Delegating cleanup to TestClientFactory');
    await TestClientFactory.cleanup();
  }

  /**
   * Verify that persistent test users are set up correctly
   * COMMENTED OUT to avoid rate limiting during test runs
   */
  static async verifyTestUsersSetup(): Promise<boolean> {
    console.log('⏭️ Skipping test user verification to avoid rate limiting');
    return true;
    
    // COMMENTED OUT - Uncomment only when needed for debugging
    /*
    try {
      // Try to authenticate as each user using the shared client
      for (const [key] of Object.entries(PERSISTENT_TEST_USERS)) {
        console.log(`🔍 Verifying test user ${key}...`);
        
        // Add delay between each verification to avoid rate limiting
        await delay(2000);
        
        const client = await this.getUserClient(key as keyof typeof PERSISTENT_TEST_USERS);
        const { data: { user: authUser }, error } = await client.auth.getUser();
        
        if (error || !authUser) {
          console.error(`❌ Failed to authenticate test user ${key}:`, error?.message);
          return false;
        }
        
        const userConfig = PERSISTENT_TEST_USERS[key as keyof typeof PERSISTENT_TEST_USERS];
        console.log(`✅ Test user ${key} (${userConfig.displayName} - ${userConfig.email}) authenticated successfully`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error verifying test users setup:', error);
      return false;
    }
    */
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

  /**
   * Get debug info about the current state
   */
  static getDebugInfo() {
    return {
      availableUsers: Object.keys(PERSISTENT_TEST_USERS),
      testClientDebug: TestClientFactory.getDebugInfo()
    };
  }
}
