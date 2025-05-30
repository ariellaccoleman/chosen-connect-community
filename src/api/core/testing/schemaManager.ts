
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import {
  createSchemaWithValidation,
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
    
    // Register the schema
    schemaRegistry[schemaName] = {
      createdAt: new Date(),
      tables: result.tablesCreated,
      inUse: true
    };
    
    return schemaName;
  } catch (error) {
    logger.error('Error creating unique test schema:', error);
    return null;
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
  
  // Mark as not in use
  if (schemaRegistry[schema]) {
    schemaRegistry[schema].inUse = false;
  }
  
  // Use the improved cleanup function
  const result = await cleanupSchemaWithValidation(schema);
  
  if (!result.success) {
    logger.error(`Failed to release schema ${schema}:`, result.errors);
  } else {
    logger.info(`Successfully released schema ${schema}`);
    // Remove from registry
    delete schemaRegistry[schema];
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
  } else {
    // Remove from registry
    delete schemaRegistry[schema];
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
 * Global cleanup function to be called in Jest global teardown
 */
export async function globalTestCleanup(): Promise<void> {
  logger.info('Running global test cleanup...');
  
  // Clean up any registered schemas
  await cleanupOldTestSchemas();
  
  logger.info('Global test cleanup complete');
}

/**
 * Get current schema registry status (for debugging)
 */
export function getSchemaRegistryStatus(): SchemaRegistry {
  return { ...schemaRegistry };
}
