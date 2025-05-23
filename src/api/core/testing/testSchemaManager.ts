
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { validateSchemaReplication } from './schemaValidationUtils';
import { logger } from '@/utils/logger';

/**
 * Interface to track schema lifecycles
 */
export interface SchemaInfo {
  id: string;
  name: string;
  createdAt: Date;
  tablesCreated: string[];
  status: 'creating' | 'ready' | 'error' | 'released' | 'validated';
  validationResult?: {
    isValid: boolean;
    summary: string;
  };
}

/**
 * In-memory store of active schema information
 */
const activeSchemas: Map<string, SchemaInfo> = new Map();

/**
 * Generate a unique schema name
 */
export function generateSchemaName(prefix: string = 'test'): string {
  const uniquePart = uuidv4().replace(/-/g, '_').substring(0, 12);
  return `${prefix}_${uniquePart}`;
}

/**
 * Create a new schema for testing
 */
export async function createTestSchema(options: {
  prefix?: string;
  createUserTable?: boolean;
  validateSchema?: boolean;
} = {}): Promise<SchemaInfo> {
  const schemaId = uuidv4();
  const schemaName = generateSchemaName(options.prefix || 'test');
  
  const schemaInfo: SchemaInfo = {
    id: schemaId,
    name: schemaName,
    createdAt: new Date(),
    tablesCreated: [],
    status: 'creating',
  };
  
  activeSchemas.set(schemaId, schemaInfo);
  
  try {
    // Create the schema
    const { error: createError } = await supabase.rpc('exec_sql', { 
      query: `CREATE SCHEMA IF NOT EXISTS ${schemaName};` 
    });
    
    if (createError) {
      throw createError;
    }
    
    // Clone public schema tables
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
    
    // Create tables in the new schema
    // Fix: Check if tables exists and is an array before iterating
    const tableRows = tables && Array.isArray(tables) ? tables : [];
    
    for (const tableRow of tableRows) {
      const tableName = tableRow.table_name;
      
      // Get table definition
      const { data: tableDef, error: defError } = await supabase.rpc('pg_get_tabledef', {
        p_schema: 'public',
        p_table: tableName
      });
      
      if (defError) {
        logger.error(`Error getting definition for table ${tableName}:`, defError);
        continue;
      }
      
      // Replace schema name in the definition
      const testTableDef = tableDef.replace(/public\./g, `${schemaName}.`);
      
      // Create table in test schema
      const { error: createTableError } = await supabase.rpc('exec_sql', { 
        query: testTableDef 
      });
      
      if (!createTableError) {
        schemaInfo.tablesCreated.push(tableName);
      }
    }
    
    // Create users table if needed
    if (options.createUserTable) {
      await supabase.rpc('exec_sql', {
        query: `
          CREATE TABLE IF NOT EXISTS ${schemaName}.users (
            id UUID PRIMARY KEY,
            email TEXT,
            raw_user_meta_data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          )
        `
      });
      
      schemaInfo.tablesCreated.push('users');
    }
    
    // Validate schema if requested
    if (options.validateSchema) {
      const validationResult = await validateSchemaReplication('public', schemaName);
      schemaInfo.validationResult = {
        isValid: validationResult.isValid,
        summary: validationResult.summary
      };
      
      schemaInfo.status = validationResult.isValid ? 'validated' : 'error';
      
      if (!validationResult.isValid) {
        logger.error(`Schema validation failed for ${schemaName}:`, validationResult.summary);
      } else {
        logger.info(`Schema validation passed for ${schemaName}`);
      }
    } else {
      schemaInfo.status = 'ready';
    }
    
    return schemaInfo;
  } catch (error) {
    schemaInfo.status = 'error';
    logger.error(`Error creating test schema ${schemaName}:`, error);
    throw error;
  }
}

/**
 * Add a test user to the schema's users table
 */
export async function addTestUser(
  schema: string,
  userData: {
    id: string;
    email: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    const { error } = await supabase.rpc('exec_sql', {
      query: `
        INSERT INTO ${schema}.users (id, email, raw_user_meta_data)
        VALUES (
          '${userData.id}', 
          '${userData.email}', 
          '${JSON.stringify(userData.metadata || {})}'::jsonb
        )
        ON CONFLICT (id) DO UPDATE 
        SET email = EXCLUDED.email,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data
      `
    });
    
    if (error) {
      throw error;
    }
  } catch (error) {
    logger.error(`Error adding test user to schema ${schema}:`, error);
    throw error;
  }
}

/**
 * Check if a schema exists
 */
export async function schemaExists(schemaName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = '${schemaName}'
      `
    });
    
    if (error) {
      throw error;
    }
    
    // Use the (data || []) pattern to handle null data gracefully
    return (data || []).length > 0;
  } catch (error) {
    logger.error(`Error checking if schema ${schemaName} exists:`, error);
    return false;
  }
}

/**
 * Validate an existing schema against the public schema
 */
export async function validateTestSchema(schemaName: string): Promise<SchemaInfo | null> {
  // Find the schema info if it exists
  let schemaInfo: SchemaInfo | undefined;
  
  for (const [id, info] of activeSchemas.entries()) {
    if (info.name === schemaName) {
      schemaInfo = info;
      break;
    }
  }
  
  // If we don't have the schema info, create a placeholder
  if (!schemaInfo) {
    // Check if schema exists first
    const exists = await schemaExists(schemaName);
    if (!exists) {
      logger.error(`Cannot validate non-existent schema: ${schemaName}`);
      return null;
    }
    
    const schemaId = uuidv4();
    schemaInfo = {
      id: schemaId,
      name: schemaName,
      createdAt: new Date(),
      tablesCreated: [],
      status: 'ready'
    };
    
    activeSchemas.set(schemaId, schemaInfo);
  }
  
  try {
    // Run validation
    const validationResult = await validateSchemaReplication('public', schemaName);
    
    // Update schema info
    schemaInfo.validationResult = {
      isValid: validationResult.isValid,
      summary: validationResult.summary
    };
    
    schemaInfo.status = validationResult.isValid ? 'validated' : 'error';
    
    if (!validationResult.isValid) {
      logger.error(`Schema validation failed for ${schemaName}:`, validationResult.summary);
    } else {
      logger.info(`Schema validation passed for ${schemaName}`);
    }
    
    return schemaInfo;
  } catch (error) {
    logger.error(`Error validating test schema ${schemaName}:`, error);
    if (schemaInfo) {
      schemaInfo.status = 'error';
    }
    return null;
  }
}

/**
 * Release a schema (mark it as no longer needed and immediately drop it)
 */
export async function releaseSchema(schemaId: string): Promise<void> {
  const schema = activeSchemas.get(schemaId);
  if (schema) {
    schema.status = 'released';
    // Immediately drop the schema instead of waiting for cleanup
    await dropSchema(schema.name);
  }
}

/**
 * Drop a schema and all its objects
 */
export async function dropSchema(schemaName: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('exec_sql', {
      query: `DROP SCHEMA IF EXISTS ${schemaName} CASCADE`
    });
    
    if (error) {
      throw error;
    }
    
    logger.info(`Successfully dropped schema: ${schemaName}`);
    
    // Remove from active schemas if it exists
    for (const [id, schema] of activeSchemas.entries()) {
      if (schema.name === schemaName) {
        activeSchemas.delete(id);
        break;
      }
    }
  } catch (error) {
    logger.error(`Error dropping schema ${schemaName}:`, error);
    throw error;
  }
}

/**
 * Clean up old released schemas and any orphaned schemas
 */
export async function cleanupReleasedSchemas(maxAgeMs: number = 3600000): Promise<void> {
  const now = new Date();
  
  // Clean up tracked schemas that are old
  for (const [id, schema] of activeSchemas.entries()) {
    const ageMs = now.getTime() - schema.createdAt.getTime();
    if (ageMs > maxAgeMs || schema.status === 'released') {
      try {
        await dropSchema(schema.name);
        activeSchemas.delete(id);
      } catch (error) {
        logger.error(`Error cleaning up schema ${schema.name}:`, error);
      }
    }
  }
  
  // Also clean up any orphaned test schemas in the database
  try {
    const { data: schemas, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'test_%' 
        OR schema_name LIKE 'validation_test_%'
        OR schema_name LIKE 'existing_test_%'
        OR schema_name LIKE 'difference_test_%'
        OR schema_name LIKE 'ddl_test_%'
      `
    });
    
    if (!error && schemas) {
      for (const schemaRow of schemas) {
        const schemaName = schemaRow.schema_name;
        logger.info(`Cleaning up orphaned test schema: ${schemaName}`);
        await dropSchema(schemaName);
      }
    }
  } catch (error) {
    logger.error('Error cleaning up orphaned schemas:', error);
  }
}

/**
 * Get info about all active schemas
 */
export function getActiveSchemas(): SchemaInfo[] {
  return Array.from(activeSchemas.values());
}

/**
 * Reset all tracking (for testing purposes)
 */
export function resetSchemaTracking(): void {
  activeSchemas.clear();
}

/**
 * Force cleanup of all test schemas - use with caution
 */
export async function forceCleanupAllTestSchemas(): Promise<void> {
  logger.info('Force cleaning up all test schemas...');
  
  try {
    // Get all test schemas from the database
    const { data: schemas, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'test_%'
      `
    });
    
    if (!error && schemas) {
      for (const schemaRow of schemas) {
        const schemaName = schemaRow.schema_name;
        await dropSchema(schemaName);
      }
      logger.info(`Force cleaned ${schemas.length} test schemas`);
    }
    
    // Clear all tracking
    activeSchemas.clear();
  } catch (error) {
    logger.error('Error during force cleanup:', error);
  }
}
