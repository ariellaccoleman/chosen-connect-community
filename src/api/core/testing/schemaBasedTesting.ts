import { supabase } from '@/integrations/supabase/client';
import { createTestingRepository } from '../repository/repositoryFactory';
import { BaseRepository } from '../repository/BaseRepository';
import { createMockRepository } from '../repository/MockRepository';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';
import { 
  createTestSchema, 
  validateTestSchema,
  schemaExists, 
  releaseSchema,
  SchemaInfo 
} from './testSchemaManager';

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
 * Create a new test schema with a unique name
 */
export async function createUniqueTestSchema(options: {
  validateSchema?: boolean;
} = {}): Promise<string | null> {
  try {
    if (process.env.NODE_ENV === 'test') {
      console.log('Running in test environment, skipping schema creation');
      return null; // Return null in test environment
    }
    
    const schemaInfo = await createTestSchema({
      validateSchema: options.validateSchema
    });
    
    if (schemaInfo.validationResult && !schemaInfo.validationResult.isValid) {
      logger.error(`Created schema but validation failed: ${schemaInfo.name}`);
      logger.error(schemaInfo.validationResult.summary);
    }
    
    logger.info(`Created test schema: ${schemaInfo.name}`);
    return schemaInfo.name;
  } catch (error) {
    logger.error('Error creating unique test schema:', error);
    return null;
  }
}

/**
 * Clone public schema structure to target schema
 */
export async function cloneSchemaStructure(targetSchema: string): Promise<void> {
  try {
    if (process.env.NODE_ENV === 'test') {
      return; // Skip in test environment
    }
    
    // Get list of tables from public schema
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `
    });
    
    if (tablesError) {
      throw tablesError;
    }
    
    // For each table, get its definition and create in test schema
    for (const tableRow of tables || []) {
      const tableName = tableRow.table_name;
      
      // Get table definition using the pg_get_tabledef function
      const { data: tableDef, error: defError } = await supabase.rpc('pg_get_tabledef', {
        p_schema: 'public',
        p_table: tableName
      });
      
      if (defError) {
        console.error(`Error getting definition for table ${tableName}:`, defError);
        continue;
      }
      
      // Replace schema name in the definition
      const testTableDef = tableDef.replace(/public\./, `${targetSchema}.`);
      
      // Create table in test schema
      await supabase.rpc('exec_sql', { query: testTableDef });
      
      // Register table in schema registry
      if (schemaRegistry[targetSchema]) {
        schemaRegistry[targetSchema].tables.push(tableName);
      }
      
      console.log(`Cloned table ${tableName} to schema ${targetSchema}`);
    }
    
    console.log(`Cloned public schema structure to ${targetSchema}`);
  } catch (error) {
    console.error('Error cloning schema structure:', error);
    throw error;
  }
}

/**
 * Verify that required tables exist in the test schema
 * and optionally validate the schema structure
 */
export async function verifySchemaSetup(
  schema: string, 
  options: {
    requiredTables?: string[];
    validateStructure?: boolean;
  } = {}
): Promise<boolean> {
  try {
    if (process.env.NODE_ENV === 'test') {
      return true; // Skip verification in test environment
    }
    
    // First, check if required tables exist
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '${schema}'
      `
    });
    
    if (error) {
      logger.error('Error verifying schema setup:', error);
      return false;
    }
    
    // Extract table names from result
    const existingTables = (data || []).map((row: any) => row.table_name);
    
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
    
    // Perform full schema validation if requested
    if (options.validateStructure) {
      const validationResult = await validateTestSchema(schema);
      if (!validationResult || !validationResult.validationResult?.isValid) {
        logger.error(`Schema validation failed for ${schema}`);
        if (validationResult?.validationResult) {
          logger.error(validationResult.validationResult.summary);
        }
        return false;
      }
      
      logger.info(`Schema validation passed for ${schema}`);
    }
    
    return true;
  } catch (error) {
    logger.error('Error verifying schema:', error);
    return false;
  }
}

/**
 * Create auth.users equivalent table in test schema
 */
export async function createTestAuthUsersTable(schema: string): Promise<void> {
  try {
    if (process.env.NODE_ENV === 'test') {
      return; // Skip in test environment
    }
    
    await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS ${schema}.users (
          id UUID PRIMARY KEY,
          email TEXT,
          raw_user_meta_data JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        )
      `
    });
    
    // Register table in schema registry
    if (schemaRegistry[schema]) {
      schemaRegistry[schema].tables.push('users');
    }
    
    console.log(`Created users table in schema ${schema}`);
  } catch (error) {
    console.error('Error creating test auth users table:', error);
    throw error;
  }
}

/**
 * Releases a schema after test completion
 */
export async function releaseTestSchema(schema: string): Promise<void> {
  if (process.env.NODE_ENV === 'test' || !schema) {
    return; // Skip in test environment
  }
  
  if (schemaRegistry[schema]) {
    schemaRegistry[schema].inUse = false;
    console.log(`Released schema ${schema}`);
  }
  
  if (!RETAIN_TEST_SCHEMAS) {
    await dropTestSchema(schema);
  }
}

/**
 * Drop a test schema and all its objects
 */
export async function dropTestSchema(schema: string): Promise<void> {
  try {
    if (process.env.NODE_ENV === 'test' || !schema) {
      return; // Skip in test environment
    }
    
    await supabase.rpc('exec_sql', {
      query: `DROP SCHEMA IF EXISTS ${schema} CASCADE`
    });
    
    delete schemaRegistry[schema];
    console.log(`Dropped schema ${schema}`);
  } catch (error) {
    console.error(`Error dropping schema ${schema}:`, error);
  }
}

/**
 * Clean up old test schemas that are no longer in use
 */
export async function cleanupOldTestSchemas(): Promise<void> {
  try {
    if (process.env.NODE_ENV === 'test') {
      return; // Skip in test environment
    }
    
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
 * Add a test user to the users table in test schema
 */
export async function seedTestUser(
  schema: string, 
  userData: { id: string; email: string; rawUserMetaData?: any }
): Promise<void> {
  try {
    if (process.env.NODE_ENV === 'test') {
      return; // Skip in test environment
    }
    
    await supabase.rpc('exec_sql', {
      query: `
        INSERT INTO ${schema}.users (id, email, raw_user_meta_data)
        VALUES (
          '${userData.id}', 
          '${userData.email}', 
          '${JSON.stringify(userData.rawUserMetaData || {})}'::jsonb
        )
      `
    });
    
    console.log(`Added test user ${userData.email} to schema ${schema}`);
  } catch (error) {
    console.error('Error seeding test user:', error);
  }
}

/**
 * Set up the testing schema by cloning the structure from public schema
 */
export async function setupTestSchema(options: {
  schemaName?: string;
  requiredTables?: string[];
  seedUsers?: Array<{ id: string; email: string; rawUserMetaData?: any }>;
  validateSchema?: boolean;
} = {}): Promise<string | null> {
  try {
    // Check if we're in a test environment
    if (process.env.NODE_ENV === 'test') {
      logger.info('Running in test environment, skipping real database setup');
      return null;
    }
    
    // Create a unique schema or use provided name
    const schemaName = options.schemaName || await createUniqueTestSchema({
      validateSchema: options.validateSchema
    });
    
    if (!schemaName) return null;
    
    // Clone public schema structure if schema was not created with validation
    if (!options.validateSchema) {
      await cloneSchemaStructure(schemaName);
    }
    
    // Create auth.users equivalent table
    await createTestAuthUsersTable(schemaName);
    
    // Seed users if provided
    if (options.seedUsers && options.seedUsers.length > 0) {
      for (const user of options.seedUsers) {
        await seedTestUser(schemaName, user);
      }
    }
    
    // Verify schema setup
    const isValid = await verifySchemaSetup(schemaName, {
      requiredTables: options.requiredTables,
      validateStructure: options.validateSchema
    });
    
    if (!isValid) {
      logger.error(`Schema ${schemaName} setup verification failed`);
      await dropTestSchema(schemaName);
      return null;
    }
    
    logger.info(`Testing schema ${schemaName} setup complete`);
    return schemaName;
  } catch (error) {
    logger.error('Error setting up testing schema:', error);
    return null;
  }
}

/**
 * Execute raw SQL in the testing schema
 */
export async function executeTestSQL(sql: string, schema: string = 'testing'): Promise<any> {
  try {
    // Skip for test environment
    if (process.env.NODE_ENV === 'test') {
      return null;
    }
    
    // Execute SQL with schema prefix for table references
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error executing SQL in testing schema:', error);
    throw error;
  }
}

/**
 * Clear all data from a table in the testing schema
 */
export async function clearTestTable(tableName: string, schema: string = 'testing'): Promise<void> {
  try {
    // For test environment, we'll use mock data clearing
    if (process.env.NODE_ENV === 'test') {
      console.log(`Mock clearing test data from ${tableName}`);
      return;
    }
    
    await executeTestSQL(`DELETE FROM ${schema}.${tableName}`);
    console.log(`Cleared test data from ${schema}.${tableName}`);
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
  schema: string = 'testing'
): Promise<void> {
  if (!data || data.length === 0) {
    return;
  }
  
  try {
    if (process.env.NODE_ENV === 'test') {
      // For test environment, we're using the mocked client which already handles seeding
      console.log(`Mock seeding ${data.length} records into ${tableName}`);
      return;
    }
    
    const repository = createTestingRepository<T>(tableName, { schema });
    await repository.insert(data as any).execute();
    console.log(`Seeded ${data.length} records into ${schema}.${tableName}`);
  } catch (error) {
    console.error(`Error seeding test data into ${tableName}:`, error);
    throw error;
  }
}

/**
 * Create a test context that provides repositories and utilities for testing
 */
export function createTestContext<T>(tableName: string, options: {
  schema?: string;
  initialData?: T[];
  requiredTables?: string[];
  mockDataInTestEnv?: boolean;
  validateSchema?: boolean;
} = {}) {
  // The schema to use - will be determined during setup
  let testSchema = options.schema || 'testing';
  
  // Always use real database repository, never mock
  const repository = createTestingRepository<T>(tableName, { schema: testSchema });
  
  const setup = async (setupOptions: {
    initialData?: T[];
    seedUsers?: Array<{ id: string; email: string; rawUserMetaData?: any }>;
    validateSchema?: boolean;
  } = {}): Promise<void> => {
    // Ensure we have a valid schema
    if (!testSchema || testSchema === 'testing') {
      // Create a unique schema for this test context
      testSchema = await setupTestSchema({
        requiredTables: options.requiredTables,
        seedUsers: setupOptions.seedUsers,
        validateSchema: setupOptions.validateSchema || options.validateSchema
      }) || 'testing';
    }
    
    // Clear existing data first
    await clearTestTable(tableName, testSchema);
    
    // Seed initial data if provided
    const dataToSeed = setupOptions.initialData || options.initialData;
    if (dataToSeed && dataToSeed.length > 0) {
      await seedTestData(tableName, dataToSeed, testSchema);
    }
  };
  
  const cleanup = async (): Promise<void> => {
    if (process.env.NODE_ENV === 'test') {
      // Clear mock data
      if (options.mockDataInTestEnv !== false) {
        const mockRepo = repository as any;
        if (mockRepo.mockData) {
          mockRepo.mockData[tableName] = [];
        }
      }
    } else {
      // Clear data but don't drop schema - that's handled by releaseTestSchema
      await clearTestTable(tableName, testSchema);
    }
  };
  
  const getCurrentSchema = (): string => {
    return testSchema;
  };
  
  const getRepository = (): BaseRepository<T> => {
    return repository;
  };
  
  const release = async (): Promise<void> => {
    await cleanup();
    if (testSchema && testSchema !== 'testing') {
      await releaseTestSchema(testSchema);
    }
  };
  
  // Add a method to validate the schema structure
  const validateSchema = async (): Promise<SchemaInfo | null> => {
    if (process.env.NODE_ENV === 'test') {
      return null;
    }
    
    return await validateTestSchema(testSchema);
  };
  
  return {
    repository,
    setup,
    cleanup,
    getCurrentSchema,
    getRepository,
    validateSchema,
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
    if (process.env.NODE_ENV !== 'test') {
      return await setupTestSchema(options);
    }
    return null;
  };
}

/**
 * Create a Jest afterAll hook that cleans up the testing schema
 */
export function teardownTestingEnvironment(schema: string | null = null, tableNames: string[] = []) {
  return async (): Promise<void> => {
    if (process.env.NODE_ENV !== 'test' && schema) {
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
