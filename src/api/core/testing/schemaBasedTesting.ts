
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { createTestingRepository } from '../repository/repositoryFactory';
import { BaseRepository } from '../repository/BaseRepository';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';
import {
  validateSchemaInfrastructure,
  createSchemaWithValidation,
  getTableDDL,
  cleanupSchemaWithValidation
} from './schemaInfrastructureFixes';

/**
 * Schema registry to track created test schemas
 */
interface SchemaRegistry {
  [schemaId: string]: {
    createdAt: Date;
    tables: string[];
    inUse: boolean;
  };
}

// In-memory registry of schemas created during test runs
const schemaRegistry: SchemaRegistry = {};

// Environment variable to control schema retention (useful for debugging)
const RETAIN_TEST_SCHEMAS = process.env.RETAIN_TEST_SCHEMAS === 'true';

// Maximum age of schemas before cleanup (in milliseconds) - default 1 hour
const MAX_SCHEMA_AGE_MS = parseInt(process.env.MAX_SCHEMA_AGE_MS || '3600000');

/**
 * Generate a unique schema name based on UUID
 */
export function generateSchemaName(): string {
  // Create a safe schema name (PostgreSQL identifiers limited to 63 bytes)
  const shortUuid = uuidv4().replace(/-/g, '_').substring(0, 16);
  return `test_${shortUuid}`;
}

/**
 * Create a new test schema with enhanced validation and error handling
 */
export async function createUniqueTestSchema(options: {
  validateSchema?: boolean;
  validateInfrastructure?: boolean;
} = {}): Promise<string | null> {
  try {
    // Validate infrastructure first if requested
    if (options.validateInfrastructure) {
      logger.info('Validating schema infrastructure before creating test schema...');
      const infraValidation = await validateSchemaInfrastructure();
      
      if (!infraValidation.execSqlWorking || !infraValidation.publicSchemaHasTables) {
        logger.error('Schema infrastructure validation failed:', infraValidation.errors);
        return null;
      }
      
      if (!infraValidation.pgGetTabledefWorking) {
        logger.warn('pg_get_tabledef function not working, schema validation may fail');
      }
    }

    const schemaName = generateSchemaName();
    logger.info(`Creating unique test schema: ${schemaName}`);

    // Use the improved schema creation function
    const result = await createSchemaWithValidation(schemaName);
    
    if (!result.success) {
      logger.error(`Failed to create schema ${schemaName}:`, result.errors);
      return null;
    }

    if (result.tablesCreated.length === 0) {
      logger.error(`Schema ${schemaName} created but no tables were replicated`);
      await cleanupSchemaWithValidation(schemaName);
      return null;
    }

    logger.info(`Successfully created test schema ${schemaName} with ${result.tablesCreated.length} tables`);
    
    return schemaName;
  } catch (error) {
    logger.error('Error creating unique test schema:', error);
    return null;
  }
}

/**
 * Verify that required tables exist in the test schema with enhanced validation
 */
export async function verifySchemaSetup(
  schema: string, 
  options: {
    requiredTables?: string[];
    validateStructure?: boolean;
  } = {}
): Promise<boolean> {
  try {
    logger.info(`Verifying schema setup for: ${schema}`);

    // Use secure function to get schema information
    const serviceClient = TestClientFactory.getServiceRoleClient();
    const { data: schemaData, error: schemaError } = await serviceClient.rpc('validate_schema_structure', {
      target_schema: schema
    });
    
    if (schemaError) {
      logger.error('Error verifying schema setup:', schemaError);
      return false;
    }
    
    if (!schemaData || typeof schemaData !== 'object') {
      logger.error('Invalid schema data received');
      return false;
    }
    
    const result = schemaData as { 
      table_count: number; 
      tables: Array<{ table_name: string }> 
    };
    
    // Extract table names from result
    const existingTables = (result.tables || []).map(table => table.table_name);
    logger.info(`Found ${existingTables.length} tables in schema ${schema}`);
    
    // Check required tables
    const requiredTables = options.requiredTables || [];
    if (requiredTables.length > 0) {
      const missingTables = requiredTables.filter(
        table => !existingTables.includes(table)
      );
      
      if (missingTables.length > 0) {
        logger.error(`Schema verification failed: Missing tables in ${schema}:`, missingTables);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    logger.error('Error verifying schema:', error);
    return false;
  }
}

/**
 * Releases a schema after test completion with improved cleanup
 */
export async function releaseTestSchema(schema: string): Promise<void> {
  if (!schema) {
    return;
  }
  
  logger.info(`Releasing test schema: ${schema}`);
  
  // Use the improved cleanup function
  const result = await cleanupSchemaWithValidation(schema);
  
  if (!result.success) {
    logger.error(`Failed to release schema ${schema}:`, result.errors);
  } else {
    logger.info(`Successfully released schema ${schema}`);
  }
}

/**
 * Drop a test schema using improved cleanup
 */
export async function dropTestSchema(schema: string): Promise<void> {
  if (!schema) {
    return;
  }
  
  const result = await cleanupSchemaWithValidation(schema);
  
  if (!result.success) {
    logger.error(`Failed to drop schema ${schema}:`, result.errors);
  }
}

/**
 * Clean up old test schemas that are no longer in use
 */
export async function cleanupOldTestSchemas(): Promise<void> {
  try {
    const now = new Date();
    const schemasToClean = Object.entries(schemaRegistry)
      .filter(([_, info]) => {
        const ageMs = now.getTime() - info.createdAt.getTime();
        return !info.inUse && ageMs > MAX_SCHEMA_AGE_MS;
      })
      .map(([schemaId]) => schemaId);
    
    for (const schema of schemasToClean) {
      await dropTestSchema(schema);
    }
    
    console.log(`Cleaned up ${schemasToClean.length} old test schemas`);
  } catch (error) {
    console.error('Error cleaning up old schemas:', error);
  }
}

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
    
    // Run cleanup of old schemas periodically
    await cleanupOldTestSchemas();
  };
}

/**
 * Global cleanup function to be called in Jest global teardown
 */
export async function globalTestCleanup(): Promise<void> {
  logger.info('Running global test cleanup...');
  
  // Also clean up any registered schemas
  await cleanupOldTestSchemas();
  
  logger.info('Global test cleanup complete');
}

/**
 * Enhanced DDL comparison with better error handling
 */
export async function compareSchemasDDLEnhanced(sourceSchema: string, targetSchema: string): Promise<{
  source: string;
  target: string;
  success: boolean;
  errors: string[];
}> {
  logger.info(`Comparing DDL between schemas: ${sourceSchema} and ${targetSchema}`);
  
  const [sourceResult, targetResult] = await Promise.all([
    getTableDDL(sourceSchema),
    getTableDDL(targetSchema)
  ]);
  
  const errors = [...sourceResult.errors, ...targetResult.errors];
  const success = sourceResult.success && targetResult.success;
  
  if (!success) {
    logger.error('DDL comparison failed:', errors);
  } else {
    logger.info(`DDL comparison successful: source (${sourceResult.tableCount} tables), target (${targetResult.tableCount} tables)`);
  }
  
  return {
    source: sourceResult.ddl,
    target: targetResult.ddl,
    success,
    errors
  };
}
