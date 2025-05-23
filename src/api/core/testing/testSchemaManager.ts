
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface to track schema lifecycles
 */
export interface SchemaInfo {
  id: string;
  name: string;
  createdAt: Date;
  tablesCreated: string[];
  status: 'creating' | 'ready' | 'error' | 'released';
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
        console.error(`Error getting definition for table ${tableName}:`, defError);
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
    
    schemaInfo.status = 'ready';
    return schemaInfo;
  } catch (error) {
    schemaInfo.status = 'error';
    console.error(`Error creating test schema ${schemaName}:`, error);
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
    console.error(`Error adding test user to schema ${schema}:`, error);
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
    
    // Fix: Be more explicit with null checking and use a type guard pattern
    if (data === null) {
      return false;
    }
    
    return Array.isArray(data) && data.length > 0;
  } catch (error) {
    console.error(`Error checking if schema ${schemaName} exists:`, error);
    return false;
  }
}

/**
 * Release a schema (mark it as no longer needed)
 */
export function releaseSchema(schemaId: string): void {
  const schema = activeSchemas.get(schemaId);
  if (schema) {
    schema.status = 'released';
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
    
    // Remove from active schemas if it exists
    for (const [id, schema] of activeSchemas.entries()) {
      if (schema.name === schemaName) {
        activeSchemas.delete(id);
        break;
      }
    }
  } catch (error) {
    console.error(`Error dropping schema ${schemaName}:`, error);
    throw error;
  }
}

/**
 * Clean up old released schemas
 */
export async function cleanupReleasedSchemas(maxAgeMs: number = 3600000): Promise<void> {
  const now = new Date();
  
  for (const [id, schema] of activeSchemas.entries()) {
    if (schema.status === 'released') {
      const ageMs = now.getTime() - schema.createdAt.getTime();
      if (ageMs > maxAgeMs) {
        try {
          await dropSchema(schema.name);
          activeSchemas.delete(id);
        } catch (error) {
          console.error(`Error cleaning up schema ${schema.name}:`, error);
        }
      }
    }
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
