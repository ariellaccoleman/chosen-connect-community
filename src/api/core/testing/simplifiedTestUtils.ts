import { TestClientFactory, TestInfrastructure } from '@/integrations/supabase/testClient';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { TEST_USER_CONFIG } from '../../../../tests/utils/persistentTestUsers';

/**
 * Simplified Test Context for dedicated test project
 * No more complex schema manipulation - just clean, simple testing!
 */
export class SimplifiedTestContext<T> {
  private testUsers: string[] = [];
  private tableName: string;
  private options: TestContextOptions;

  constructor(tableName: string, options: TestContextOptions = {}) {
    this.tableName = tableName;
    this.options = {
      requireAuth: false,
      cleanupAfterEach: true,
      ...options
    };
  }

  /**
   * Set up test context - much simpler now!
   */
  async setup(setupOptions: TestSetupOptions = {}): Promise<void> {
    logger.info(`Setting up test context for table: ${this.tableName}`);
    
    const projectInfo = TestInfrastructure.getTestProjectInfo();
    if (projectInfo.usingDedicatedProject) {
      logger.info(`✅ Using dedicated test project: ${projectInfo.url}`);
    } else {
      logger.warn(`⚠️ Not using dedicated test project - tests may interfere with production data`);
    }

    try {
      // Clean existing data first
      if (this.options.cleanupAfterEach) {
        await TestInfrastructure.cleanupTable(this.tableName);
      }

      // Create test users if authentication is required
      if (this.options.requireAuth && setupOptions.testUsers) {
        for (const userConfig of setupOptions.testUsers) {
          const user = await TestInfrastructure.createTestUser(
            userConfig.email,
            userConfig.password,
            userConfig.metadata
          );
          this.testUsers.push(user.id);
        }
      }

      // Seed initial data
      if (setupOptions.initialData && setupOptions.initialData.length > 0) {
        await TestInfrastructure.seedTable(this.tableName, setupOptions.initialData);
      }

    } catch (error) {
      logger.error('Failed to setup test context:', error);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Get appropriate client for testing
   */
  getClient(authenticated = false, userEmail?: string, userPassword?: string) {
    if (authenticated && userEmail && userPassword) {
      return TestClientFactory.createAuthenticatedClient(userEmail, userPassword);
    }
    
    return TestClientFactory.getAnonClient();
  }

  /**
   * Clean up test data
   */
  async cleanup(): Promise<void> {
    logger.info('Cleaning up test context');

    try {
      // Clean up test users
      for (const userId of this.testUsers) {
        try {
          await TestInfrastructure.deleteTestUser(userId);
        } catch (error) {
          logger.warn(`Failed to delete test user ${userId}:`, error);
        }
      }

      // Clean table data
      if (this.options.cleanupAfterEach) {
        await TestInfrastructure.cleanupTable(this.tableName);
      }

    } catch (error) {
      logger.error('Error during test cleanup:', error);
    } finally {
      this.testUsers = [];
    }
  }

  /**
   * Release resources
   */
  async release(): Promise<void> {
    await this.cleanup();
    TestClientFactory.cleanup();
  }
}

/**
 * Configuration interfaces
 */
interface TestContextOptions {
  requireAuth?: boolean;
  cleanupAfterEach?: boolean;
}

interface TestSetupOptions {
  initialData?: any[];
  testUsers?: Array<{
    email: string;
    password: string;
    metadata?: any;
  }>;
}

/**
 * Helper function to create a simplified test context
 */
export function createSimplifiedTestContext<T>(
  tableName: string, 
  options: TestContextOptions = {}
): SimplifiedTestContext<T> {
  return new SimplifiedTestContext<T>(tableName, options);
}

/**
 * Test user factory with unique emails for the test project
 */
export class TestUserFactory {
  static createTestUser(prefix = 'test') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    
    return {
      email: `${prefix}_${timestamp}_${random}@testproject.example`,
      password: TEST_USER_CONFIG.password, // Use centralized password
      metadata: {
        first_name: 'Test',
        last_name: 'User',
        created_for_testing: true,
        test_project: true
      }
    };
  }

  static createMultipleTestUsers(count: number, prefix = 'test') {
    return Array(count).fill(null).map(() => this.createTestUser(prefix));
  }

  /**
   * Get the standard test password for all test users
   */
  static getStandardTestPassword(): string {
    return TEST_USER_CONFIG.password;
  }
}
