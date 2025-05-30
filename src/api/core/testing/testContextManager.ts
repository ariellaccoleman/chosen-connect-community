import { TestClientFactory } from '@/integrations/supabase/testClient';
import { createTestingRepository } from '../repository/repositoryFactory';
import { BaseRepository } from '../repository/BaseRepository';
import { logger } from '@/utils/logger';
import { 
  createUniqueTestSchema, 
  releaseTestSchema,
  dropTestSchema
} from './schemaManager';
import { 
  verifySchemaSetup,
  validateInfrastructure 
} from './schemaValidator';

/**
 * Set up the testing schema with enhanced validation and error handling
 */
export async function setupTestSchema(options: {
  schemaName?: string;
  requiredTables?: string[];
  seedUsers?: Array<{ id: string; email: string; rawUserMetaData?: any }>;
  validateSchema?: boolean;
  validateInfrastructure?: boolean;
} = {}): Promise<string | null> {
  try {
    logger.info('Setting up test schema with enhanced validation...');

    // Validate infrastructure first if requested
    if (options.validateInfrastructure) {
      const infraValidation = await validateInfrastructure();
      if (!infraValidation.success) {
        logger.error('Infrastructure validation failed:', infraValidation.errors);
        return null;
      }
    }

    // NEVER use a provided schema name - always create unique ones
    const schemaName = await createUniqueTestSchema({
      validateSchema: options.validateSchema,
      validateInfrastructure: options.validateInfrastructure
    });
    
    if (!schemaName) {
      logger.error('Failed to create unique test schema');
      return null;
    }
    
    // Verify schema setup with enhanced validation
    const isValid = await verifySchemaSetup(schemaName, {
      requiredTables: options.requiredTables,
      validateStructure: options.validateSchema
    });
    
    if (!isValid) {
      logger.error(`Schema ${schemaName} setup verification failed`);
      await dropTestSchema(schemaName);
      return null;
    }
    
    logger.info(`Testing schema ${schemaName} setup complete and validated`);
    return schemaName;
  } catch (error) {
    logger.error('Error setting up testing schema:', error);
    return null;
  }
}

/**
 * Clear all data from a table in the testing schema
 */
export async function clearTestTable(tableName: string, schema: string): Promise<void> {
  try {
    // Use the anon client for data operations
    const client = TestClientFactory.getAnonClient();
    
    // For now, just log that we would clear the table
    // since we can't dynamically specify table names
    console.log(`Would clear test data from ${schema}.${tableName}`);
  } catch (error) {
    console.error(`Error clearing test data from ${tableName}:`, error);
    throw error;
  }
}

/**
 * Seed test data into a table in the testing schema
 */
export async function seedTestData<T>(
  tableName: string, 
  data: T[],
  schema: string
): Promise<void> {
  if (!data || data.length === 0) {
    return;
  }
  
  try {
    const repository = createTestingRepository<T>(tableName, { schema });
    await repository.insert(data as any).execute();
    console.log(`Seeded ${data.length} records into ${schema}.${tableName}`);
  } catch (error) {
    console.error(`Error seeding test data into ${tableName}:`, error);
    throw error;
  }
}

/**
 * Create a test context with enhanced schema validation
 */
export function createTestContext<T>(tableName: string, options: {
  schema?: string; // This will be ignored - always create unique schemas
  initialData?: T[];
  requiredTables?: string[];
  mockDataInTestEnv?: boolean;
  validateSchema?: boolean;
  validateInfrastructure?: boolean;
} = {}) {
  // Always start with a unique schema - ignore any provided schema option
  let testSchema: string | null = null;
  
  // Always use real database repository, never mock
  const getRepository = (): BaseRepository<T> => {
    if (!testSchema) {
      throw new Error('Test context not set up - call setup() first');
    }
    return createTestingRepository<T>(tableName, { schema: testSchema });
  };
  
  const setup = async (setupOptions: {
    initialData?: T[];
    seedUsers?: Array<{ id: string; email: string; rawUserMetaData?: any }>;
    validateSchema?: boolean;
    validateInfrastructure?: boolean;
  } = {}): Promise<void> => {
    logger.info(`Setting up test context for table: ${tableName}`);
    
    // Create a unique schema for this test context
    testSchema = await setupTestSchema({
      requiredTables: options.requiredTables,
      seedUsers: setupOptions.seedUsers,
      validateSchema: setupOptions.validateSchema || options.validateSchema,
      validateInfrastructure: setupOptions.validateInfrastructure || options.validateInfrastructure
    });
    
    if (!testSchema) {
      throw new Error('Failed to create test schema');
    }

    logger.info(`Test context using schema: ${testSchema}`);
    
    // Clear existing data first
    await clearTestTable(tableName, testSchema);
    
    // Seed initial data if provided
    const dataToSeed = setupOptions.initialData || options.initialData;
    if (dataToSeed && dataToSeed.length > 0) {
      await seedTestData(tableName, dataToSeed, testSchema);
    }
  };
  
  const cleanup = async (): Promise<void> => {
    if (testSchema) {
      // Clear data but don't drop schema - that's handled by releaseTestSchema
      await clearTestTable(tableName, testSchema);
    }
  };
  
  const getCurrentSchema = (): string => {
    if (!testSchema) {
      throw new Error('Test context not set up - call setup() first');
    }
    return testSchema;
  };
  
  const release = async (): Promise<void> => {
    await cleanup();
    if (testSchema) {
      await releaseTestSchema(testSchema);
      testSchema = null;
    }
  };
  
  return {
    repository: getRepository(), // Kept for backward compatibility
    setup,
    cleanup,
    getCurrentSchema,
    getRepository,
    release
  };
}

/**
 * Create a Jest beforeAll hook that sets up the testing schema
 */
export function setupTestingEnvironment(options: {
  requiredTables?: string[];
  seedUsers?: Array<{ id: string; email: string; rawUserMetaData?: any }>;
} = {}) {
  return async (): Promise<string | null> => {
    return await setupTestSchema(options);
  };
}

/**
 * Create a Jest afterAll hook that cleans up the testing schema
 */
export function teardownTestingEnvironment(schema: string | null = null, tableNames: string[] = []) {
  return async (): Promise<void> => {
    if (schema) {
      for (const tableName of tableNames) {
        await clearTestTable(tableName, schema);
      }
      
      // Release the schema after tests are complete
      await releaseTestSchema(schema);
    }
  };
}
