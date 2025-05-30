
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { PERSISTENT_TEST_USERS } from '../../utils/persistentTestUsers';
import { testApiRegistry } from './TestApiRegistry';
import { logger } from '@/utils/logger';

/**
 * Centralized test authentication utilities for database integration tests
 * Provides consistent authenticated API access across test suites with dynamic API support
 */
export class CentralTestAuthUtils {
  /**
   * Execute a test function with an authenticated API client
   * @param userKey - The user key (user1, user2, user3, etc.)
   * @param testFunction - Function to execute with the authenticated client
   * @returns Result of the test function
   */
  static async executeWithAuthenticatedAPI<T>(
    userKey: keyof typeof PERSISTENT_TEST_USERS,
    testFunction: (client: any) => Promise<T>
  ): Promise<T> {
    const userConfig = PERSISTENT_TEST_USERS[userKey];
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
   * Execute test with authentication and specific API reset
   * @param apiName - Name of the API to reset (from registry)
   * @param testOperation - Test function to execute
   * @param userKey - User key for authentication
   */
  static async executeWithSpecificAPI<T>(
    apiName: string,
    testOperation: (api: any, context: { client: any; user: any }) => Promise<T>,
    userKey: keyof typeof PERSISTENT_TEST_USERS = 'user1'
  ): Promise<T> {
    const userConfig = PERSISTENT_TEST_USERS[userKey];
    if (!userConfig) {
      throw new Error(`User configuration not found for key: ${userKey}`);
    }

    // Check if API is registered
    const registeredApis = testApiRegistry.getRegisteredApis();
    if (!registeredApis.includes(apiName)) {
      throw new Error(`API '${apiName}' not found. Available APIs: ${registeredApis.join(', ')}`);
    }

    const client = await TestClientFactory.getUserClient(
      userConfig.email,
      userConfig.password
    );

    const user = await TestClientFactory.getCurrentAuthenticatedUser(userConfig.email);

    try {
      // Try to get reset API first, fall back to factory function
      let api;
      try {
        api = testApiRegistry.resetApi(apiName, client);
      } catch (error) {
        // If no reset function, try factory function
        api = testApiRegistry.getFactoryFunction(apiName);
        if (!api) {
          throw new Error(`No API function available for: ${apiName}`);
        }
      }

      const result = await testOperation(api, { client, user });
      return result;
    } finally {
      // Cleanup is handled by TestClientFactory
    }
  }

  /**
   * Execute test with all available reset APIs
   * @param testOperation - Test function to execute with all APIs
   * @param userKey - User key for authentication
   */
  static async executeWithAllAPIs<T>(
    testOperation: (apis: Record<string, any>, context: { client: any; user: any }) => Promise<T>,
    userKey: keyof typeof PERSISTENT_TEST_USERS = 'user1'
  ): Promise<T> {
    const userConfig = PERSISTENT_TEST_USERS[userKey];
    if (!userConfig) {
      throw new Error(`User configuration not found for key: ${userKey}`);
    }

    const client = await TestClientFactory.getUserClient(
      userConfig.email,
      userConfig.password
    );

    const user = await TestClientFactory.getCurrentAuthenticatedUser(userConfig.email);

    try {
      const apis = testApiRegistry.getAllResetApis(client);
      const result = await testOperation(apis, { client, user });
      return result;
    } finally {
      // Cleanup is handled by TestClientFactory
    }
  }

  /**
   * Get the authenticated user for a given user key
   * @param userKey - The user key
   * @returns The authenticated user object
   */
  static async getAuthenticatedUser(userKey: keyof typeof PERSISTENT_TEST_USERS) {
    const userConfig = PERSISTENT_TEST_USERS[userKey];
    if (!userConfig) {
      throw new Error(`User configuration not found for key: ${userKey}`);
    }

    return await TestClientFactory.getCurrentAuthenticatedUser(userConfig.email);
  }

  /**
   * Get available APIs for testing
   */
  static getAvailableApis(): string[] {
    return testApiRegistry.getRegisteredApis();
  }

  /**
   * Check if an API is available for testing
   */
  static isApiAvailable(apiName: string): boolean {
    return testApiRegistry.getRegisteredApis().includes(apiName);
  }

  /**
   * Clean up authentication state for all test users
   */
  static async cleanup(): Promise<void> {
    await TestClientFactory.clearAllUserClients();
  }

  /**
   * Get debug information about available APIs
   */
  static getDebugInfo() {
    return {
      availableApis: testApiRegistry.getRegisteredApis(),
      totalRegisteredApis: testApiRegistry.getRegisteredApis().length,
      version: '2.0.0'
    };
  }
}
