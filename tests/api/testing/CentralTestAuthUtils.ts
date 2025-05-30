
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { TEST_USER_CONFIG } from '../../utils/persistentTestUsers';

/**
 * Centralized test authentication utilities for database integration tests
 * Provides consistent authenticated API access across test suites
 */
export class CentralTestAuthUtils {
  /**
   * Execute a test function with an authenticated API client
   * @param userKey - The user key (user1, user2, user3, etc.)
   * @param testFunction - Function to execute with the authenticated client
   * @returns Result of the test function
   */
  static async executeWithAuthenticatedAPI<T>(
    userKey: keyof typeof TEST_USER_CONFIG.users,
    testFunction: (client: any) => Promise<T>
  ): Promise<T> {
    const userConfig = TEST_USER_CONFIG.users[userKey];
    if (!userConfig) {
      throw new Error(`User configuration not found for key: ${userKey}`);
    }

    // Get authenticated client for the specific user
    const client = await TestClientFactory.getUserClient(
      userConfig.email,
      userConfig.password
    );

    // Execute the test function with the authenticated client
    return await testFunction(client);
  }

  /**
   * Get the authenticated user for a given user key
   * @param userKey - The user key
   * @returns The authenticated user object
   */
  static async getAuthenticatedUser(userKey: keyof typeof TEST_USER_CONFIG.users) {
    const userConfig = TEST_USER_CONFIG.users[userKey];
    if (!userConfig) {
      throw new Error(`User configuration not found for key: ${userKey}`);
    }

    return await TestClientFactory.getCurrentAuthenticatedUser(userConfig.email);
  }

  /**
   * Clean up authentication state for all test users
   */
  static async cleanup(): Promise<void> {
    await TestClientFactory.clearAllUserClients();
  }
}
