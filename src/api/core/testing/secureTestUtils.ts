import { TestClientFactory, TestInfrastructure } from '@/integrations/supabase/testClient';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { TEST_USER_CONFIG } from '../../../../tests/utils/persistentTestUsers';

/**
 * Secure Test Context Manager (Legacy)
 * NOTE: This is the legacy approach. Use SimplifiedTestContext instead for new tests.
 */
export class SecureTestContext<T> {
  private testUsers: string[] = [];
  private tableName: string;
  private options: TestContextOptions;

  constructor(tableName: string, options: TestContextOptions = {}) {
    this.tableName = tableName;
    this.options = {
      requireAuth: true,
      validateSchema: false, // Disabled for simplified approach
      ...options
    };
  }

  /**
   * Set up test context with proper isolation and security
   */
  async setup(setupOptions: TestSetupOptions = {}): Promise<void> {
    logger.info(`Setting up secure test context for table: ${this.tableName}`);

    try {
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

      // Note: Schema validation and creation removed for simplified approach
      // Use the simplified test utilities instead

      // Seed initial data using anon client (with proper auth if needed)
      if (setupOptions.initialData && setupOptions.initialData.length > 0) {
        await this.seedData(setupOptions.initialData, setupOptions.authenticatedUser);
      }

    } catch (error) {
      logger.error('Failed to setup secure test context:', error);
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
    
    // Use anon client for most application logic testing
    return TestClientFactory.getAnonClient();
  }

  /**
   * Seed test data with proper authentication context
   */
  private async seedData(data: T[], authenticatedUser?: { email: string; password: string }): Promise<void> {
    const client = authenticatedUser 
      ? await TestClientFactory.createAuthenticatedClient(authenticatedUser.email, authenticatedUser.password)
      : TestClientFactory.getAnonClient();

    try {
      // Use the simplified seeding approach
      await TestInfrastructure.seedTable(this.tableName, data);
      logger.info(`Seeded ${data.length} records into ${this.tableName}`);
    } catch (error) {
      logger.error('Error seeding test data:', error);
      throw error;
    }
  }

  /**
   * Clean up test data (only data, not schema structure)
   */
  async cleanup(): Promise<void> {
    logger.info('Cleaning up secure test context');

    try {
      // Clean up test users
      for (const userId of this.testUsers) {
        try {
          await TestInfrastructure.deleteTestUser(userId);
        } catch (error) {
          logger.warn(`Failed to delete test user ${userId}:`, error);
        }
      }

      // Clean table data using simplified approach
      await TestInfrastructure.cleanupTable(this.tableName);

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
  validateSchema?: boolean;
  useIsolatedSchema?: boolean;
}

interface TestSetupOptions {
  initialData?: any[];
  testUsers?: Array<{
    email: string;
    password: string;
    metadata?: any;
  }>;
  authenticatedUser?: {
    email: string;
    password: string;
  };
}

/**
 * Helper function to create a secure test context
 */
export function createSecureTestContext<T>(
  tableName: string, 
  options: TestContextOptions = {}
): SecureTestContext<T> {
  return new SecureTestContext<T>(tableName, options);
}

/**
 * Test user factory for creating consistent test users (legacy version)
 */
export class TestUserFactory {
  static createTestUser(prefix = 'secure_test') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    
    return {
      email: `${prefix}_${timestamp}_${random}@legacy.example.com`,
      password: TEST_USER_CONFIG.password, // Use centralized password
      metadata: {
        first_name: 'Secure Test',
        last_name: 'User',
        created_for_testing: true,
        legacy_approach: true
      }
    };
  }

  static createMultipleTestUsers(count: number, prefix = 'secure_test') {
    return Array(count).fill(null).map(() => this.createTestUser(prefix));
  }

  /**
   * Get the standard test password for all test users
   */
  static getStandardTestPassword(): string {
    return TEST_USER_CONFIG.password;
  }
}
