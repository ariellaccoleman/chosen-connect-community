
/**
 * Test Authentication Utilities
 * 
 * This module provides utilities for setting up authenticated test environments
 * and ensuring all APIs use the authenticated test client.
 */

import { createClient } from '@supabase/supabase-js';
import { resetAllApis } from '../apiResetUtils';
import { logger } from '@/utils/logger';

/**
 * Test authentication configuration
 */
interface TestAuthConfig {
  testEmail?: string;
  testPassword?: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  serviceRoleKey?: string;
}

/**
 * Default test configuration
 */
const defaultTestConfig: TestAuthConfig = {
  testEmail: 'test@example.com',
  testPassword: 'testpassword123',
  supabaseUrl: process.env.TEST_SUPABASE_URL || process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.TEST_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
};

/**
 * Test authentication utilities
 */
export class TestAuthUtils {
  private static authenticatedClient: any = null;
  private static testUser: any = null;

  /**
   * Set up authenticated test environment
   * 
   * @param config - Optional test configuration override
   * @returns Object containing authenticated client and user
   */
  static async setupTestAuth(config: Partial<TestAuthConfig> = {}) {
    const testConfig = { ...defaultTestConfig, ...config };
    
    logger.info('Setting up authenticated test environment');
    
    try {
      // Create test client
      const testClient = createClient(testConfig.supabaseUrl, testConfig.supabaseAnonKey, {
        auth: {
          storage: undefined, // Use memory storage for tests
          persistSession: false,
          autoRefreshToken: false
        }
      });

      // Sign in test user
      const { data: authData, error: authError } = await testClient.auth.signInWithPassword({
        email: testConfig.testEmail!,
        password: testConfig.testPassword!
      });

      if (authError) {
        logger.error('Failed to authenticate test user:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Authentication succeeded but no user returned');
      }

      // Store authenticated client and user
      TestAuthUtils.authenticatedClient = testClient;
      TestAuthUtils.testUser = authData.user;
      
      logger.info(`Test user authenticated: ${authData.user.email}`);
      
      // CRITICAL: Reset all APIs with the authenticated client
      // This ensures all repositories get the authenticated client instead of the default unauthenticated one
      resetAllApis(testClient);
      
      logger.info('All APIs reset with authenticated test client');

      return {
        client: testClient,
        user: authData.user,
        session: authData.session
      };
    } catch (error) {
      logger.error('Error setting up test auth:', error);
      throw error;
    }
  }

  /**
   * Get the current authenticated test client
   */
  static getAuthenticatedClient() {
    if (!TestAuthUtils.authenticatedClient) {
      throw new Error('Test client not authenticated. Call setupTestAuth() first.');
    }
    return TestAuthUtils.authenticatedClient;
  }

  /**
   * Get the current test user
   */
  static getTestUser() {
    if (!TestAuthUtils.testUser) {
      throw new Error('Test user not available. Call setupTestAuth() first.');
    }
    return TestAuthUtils.testUser;
  }

  /**
   * Clean up test authentication
   */
  static async cleanupTestAuth() {
    logger.info('Cleaning up test authentication');
    
    if (TestAuthUtils.authenticatedClient) {
      try {
        await TestAuthUtils.authenticatedClient.auth.signOut();
      } catch (error) {
        logger.warn('Error signing out test user:', error);
      }
      
      TestAuthUtils.authenticatedClient = null;
      TestAuthUtils.testUser = null;
    }
  }

  /**
   * Create a test user for authentication
   * This should be called in test setup if the test user doesn't exist
   */
  static async createTestUser(config: Partial<TestAuthConfig> = {}) {
    const testConfig = { ...defaultTestConfig, ...config };
    
    if (!testConfig.serviceRoleKey) {
      throw new Error('Service role key required to create test user');
    }

    logger.info('Creating test user for authentication');

    try {
      // Create admin client with service role key
      const adminClient = createClient(testConfig.supabaseUrl, testConfig.serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Create test user
      const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
        email: testConfig.testEmail!,
        password: testConfig.testPassword!,
        email_confirm: true
      });

      if (userError) {
        // If user already exists, that's fine
        if (userError.message.includes('already registered')) {
          logger.info('Test user already exists');
          return;
        }
        throw userError;
      }

      logger.info(`Test user created: ${userData.user?.email}`);
      return userData.user;
    } catch (error) {
      logger.error('Error creating test user:', error);
      throw error;
    }
  }
}

/**
 * Convenience function for quick test setup
 */
export async function setupTestAuth(config?: Partial<TestAuthConfig>) {
  return TestAuthUtils.setupTestAuth(config);
}

/**
 * Convenience function for test cleanup
 */
export async function cleanupTestAuth() {
  return TestAuthUtils.cleanupTestAuth();
}
