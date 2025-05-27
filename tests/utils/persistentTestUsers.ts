
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
  }
} as const;

/**
 * Helper functions for getting authenticated clients for persistent test users
 * Implements proper singleton pattern to ensure clients are only created once
 */
export class PersistentTestUserHelper {
  private static user1Client: SupabaseClient<Database> | null = null;
  private static user2Client: SupabaseClient<Database> | null = null;
  private static user3Client: SupabaseClient<Database> | null = null;
  
  /**
   * Get authenticated client for test user 1 (Test User4)
   * Uses singleton pattern - creates client only once
   */
  static async getUser1Client(): Promise<SupabaseClient<Database>> {
    if (!this.user1Client) {
      this.user1Client = await TestClientFactory.createAuthenticatedClient(
        PERSISTENT_TEST_USERS.user1.email,
        PERSISTENT_TEST_USERS.user1.password
      );
      console.log(`✅ Created singleton client for user1: ${PERSISTENT_TEST_USERS.user1.email}`);
    }
    return this.user1Client;
  }

  /**
   * Get authenticated client for test user 2 (Test User5)
   * Uses singleton pattern - creates client only once
   */
  static async getUser2Client(): Promise<SupabaseClient<Database>> {
    if (!this.user2Client) {
      this.user2Client = await TestClientFactory.createAuthenticatedClient(
        PERSISTENT_TEST_USERS.user2.email,
        PERSISTENT_TEST_USERS.user2.password
      );
      console.log(`✅ Created singleton client for user2: ${PERSISTENT_TEST_USERS.user2.email}`);
    }
    return this.user2Client;
  }

  /**
   * Get authenticated client for test user 3 (Test User6)
   * Uses singleton pattern - creates client only once
   */
  static async getUser3Client(): Promise<SupabaseClient<Database>> {
    if (!this.user3Client) {
      this.user3Client = await TestClientFactory.createAuthenticatedClient(
        PERSISTENT_TEST_USERS.user3.email,
        PERSISTENT_TEST_USERS.user3.password
      );
      console.log(`✅ Created singleton client for user3: ${PERSISTENT_TEST_USERS.user3.email}`);
    }
    return this.user3Client;
  }

  /**
   * Get authenticated client for any user by key
   */
  static async getUserClient(userKey: keyof typeof PERSISTENT_TEST_USERS): Promise<SupabaseClient<Database>> {
    switch (userKey) {
      case 'user1':
        return this.getUser1Client();
      case 'user2':
        return this.getUser2Client();
      case 'user3':
        return this.getUser3Client();
      default:
        throw new Error(`Unknown user key: ${userKey}`);
    }
  }

  /**
   * Clear all singleton clients - useful for test cleanup
   */
  static clearAllClients(): void {
    if (this.user1Client) {
      console.log('🧹 Clearing user1 singleton client');
      this.user1Client = null;
    }
    if (this.user2Client) {
      console.log('🧹 Clearing user2 singleton client');
      this.user2Client = null;
    }
    if (this.user3Client) {
      console.log('🧹 Clearing user3 singleton client');
      this.user3Client = null;
    }
  }

  /**
   * Verify that persistent test users are set up correctly
   * RUNTIME environment variable access
   */
  static async verifyTestUsersSetup(): Promise<boolean> {
    try {
      // Try to authenticate as each user using singleton pattern
      for (const [key] of Object.entries(PERSISTENT_TEST_USERS)) {
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
