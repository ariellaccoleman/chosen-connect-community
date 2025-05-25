
import { TestClientFactory, TestInfrastructure } from '@/integrations/supabase/testClient';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Secure Test Context Manager
 * Replaces the old schema-based testing with secure, limited operations
 */
export class SecureTestContext<T> {
  private testUsers: string[] = [];
  private testSchemas: string[] = [];
  private tableName: string;
  private options: TestContextOptions;

  constructor(tableName: string, options: TestContextOptions = {}) {
    this.tableName = tableName;
    this.options = {
      requireAuth: true,
      validateSchema: true,
      ...options
    };
  }

  /**
   * Set up test context with proper isolation and security
   */
  async setup(setupOptions: TestSetupOptions = {}): Promise<void> {
    logger.info(`Setting up secure test context for table: ${this.tableName}`);

    try {
      // Create test schema if needed for isolation
      if (this.options.useIsolatedSchema) {
        const schemaName = await TestInfrastructure.createTestSchema(this.tableName);
        this.testSchemas.push(schemaName);
        logger.info(`Created isolated test schema: ${schemaName}`);
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

      // Validate schema structure if requested
      if (this.options.validateSchema) {
        const validation = await TestInfrastructure.validateSchema('public');
        logger.info(`Schema validation passed: ${validation.table_count} tables found`);
      }

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
      for (const item of data) {
        const { error } = await client
          .from(this.tableName)
          .insert(item);

        if (error) {
          logger.error(`Failed to seed data for ${this.tableName}:`, error);
          throw error;
        }
      }

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

      // Clean up test schemas
      for (const schemaName of this.testSchemas) {
        try {
          await TestInfrastructure.dropTestSchema(schemaName);
        } catch (error) {
          logger.warn(`Failed to drop test schema ${schemaName}:`, error);
        }
      }

      // Clear data from main tables if not using isolated schema
      if (!this.options.useIsolatedSchema) {
        const client = TestClientFactory.getAnonClient();
        
        // Only delete test data (be careful not to delete production data)
        // This is a simplified approach - in practice you'd want more sophisticated cleanup
        const { error } = await client
          .from(this.tableName)
          .delete()
          .like('email', 'test%'); // Only delete obvious test records

        if (error) {
          logger.warn(`Failed to clean up test data from ${this.tableName}:`, error);
        }
      }

    } catch (error) {
      logger.error('Error during test cleanup:', error);
    } finally {
      this.testUsers = [];
      this.testSchemas = [];
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
 * Test user factory for creating consistent test users
 */
export class TestUserFactory {
  static createTestUser(prefix = 'test') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    
    return {
      email: `${prefix}_${timestamp}_${random}@example.com`,
      password: 'TestPassword123!',
      metadata: {
        first_name: 'Test',
        last_name: 'User',
        created_for_testing: true
      }
    };
  }

  static createMultipleTestUsers(count: number, prefix = 'test') {
    return Array(count).fill(null).map(() => this.createTestUser(prefix));
  }
}
