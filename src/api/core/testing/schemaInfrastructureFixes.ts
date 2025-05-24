
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Test and validate core schema infrastructure functions
 */
export async function validateSchemaInfrastructure(): Promise<{
  execSqlWorking: boolean;
  pgGetTabledefWorking: boolean;
  publicSchemaHasTables: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let execSqlWorking = false;
  let pgGetTabledefWorking = false;
  let publicSchemaHasTables = false;

  try {
    // Test basic exec_sql function
    logger.info('Testing exec_sql function...');
    const { data: testData, error: testError } = await supabase.rpc('exec_sql', {
      query: 'SELECT 1 as test_value'
    });
    
    if (testError) {
      errors.push(`exec_sql function error: ${testError.message}`);
      logger.error('exec_sql test failed:', testError);
    } else {
      execSqlWorking = true;
      logger.info('exec_sql function working correctly');
    }

    // Test if public schema has tables
    logger.info('Checking public schema tables...');
    const { data: tablesData, error: tablesError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        LIMIT 5
      `
    });

    if (tablesError) {
      errors.push(`Failed to query public schema tables: ${tablesError.message}`);
    } else if (!tablesData || (Array.isArray(tablesData) && tablesData.length === 0)) {
      errors.push('No tables found in public schema');
    } else {
      publicSchemaHasTables = true;
      logger.info(`Found ${Array.isArray(tablesData) ? tablesData.length : 'some'} tables in public schema`);
    }

    // Test pg_get_tabledef function
    if (publicSchemaHasTables && execSqlWorking) {
      logger.info('Testing pg_get_tabledef function...');
      
      // Get a table name to test with
      const testTableName = Array.isArray(tablesData) && tablesData.length > 0 ? 
        tablesData[0].table_name : 'profiles';
      
      const { data: ddlData, error: ddlError } = await supabase.rpc('pg_get_tabledef', {
        p_schema: 'public',
        p_table: testTableName
      });

      if (ddlError) {
        errors.push(`pg_get_tabledef function error: ${ddlError.message}`);
        logger.error('pg_get_tabledef test failed:', ddlError);
      } else if (!ddlData || ddlData.trim() === '') {
        errors.push(`pg_get_tabledef returned empty DDL for table ${testTableName}`);
      } else {
        pgGetTabledefWorking = true;
        logger.info('pg_get_tabledef function working correctly');
        logger.debug('Sample DDL:', ddlData.substring(0, 100) + '...');
      }
    }

  } catch (error) {
    errors.push(`Infrastructure validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    logger.error('Schema infrastructure validation failed:', error);
  }

  return {
    execSqlWorking,
    pgGetTabledefWorking,
    publicSchemaHasTables,
    errors
  };
}

/**
 * Improved schema creation with better error handling and validation
 */
export async function createSchemaWithValidation(schemaName: string): Promise<{
  success: boolean;
  schemaName: string;
  tablesCreated: string[];
  errors: string[];
}> {
  const errors: string[] = [];
  const tablesCreated: string[] = [];

  try {
    logger.info(`Creating schema: ${schemaName}`);

    // Step 1: Create the schema
    const { error: createError } = await supabase.rpc('exec_sql', {
      query: `CREATE SCHEMA IF NOT EXISTS ${schemaName};`
    });

    if (createError) {
      errors.push(`Failed to create schema: ${createError.message}`);
      return { success: false, schemaName, tablesCreated, errors };
    }

    // Step 2: Get list of tables from public schema
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `
    });

    if (tablesError) {
      errors.push(`Failed to get public schema tables: ${tablesError.message}`);
      return { success: false, schemaName, tablesCreated, errors };
    }

    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      errors.push('No tables found in public schema to replicate');
      return { success: false, schemaName, tablesCreated, errors };
    }

    logger.info(`Found ${tables.length} tables to replicate`);

    // Step 3: Create each table in the new schema
    for (const tableRow of tables) {
      if (tableRow && typeof tableRow === 'object' && 'table_name' in tableRow) {
        const tableName = (tableRow as { table_name: string }).table_name;
        
        try {
          // Get table definition
          const { data: tableDef, error: defError } = await supabase.rpc('pg_get_tabledef', {
            p_schema: 'public',
            p_table: tableName
          });

          if (defError) {
            errors.push(`Failed to get definition for table ${tableName}: ${defError.message}`);
            continue;
          }

          if (!tableDef || tableDef.trim() === '') {
            errors.push(`Empty DDL returned for table ${tableName}`);
            continue;
          }

          // Replace schema name in the definition
          const testTableDef = tableDef.replace(/public\./g, `${schemaName}.`);
          
          // Create table in test schema
          const { error: createTableError } = await supabase.rpc('exec_sql', {
            query: testTableDef
          });

          if (createTableError) {
            errors.push(`Failed to create table ${tableName}: ${createTableError.message}`);
          } else {
            tablesCreated.push(tableName);
            logger.debug(`Successfully created table ${tableName} in schema ${schemaName}`);
          }

        } catch (tableError) {
          errors.push(`Error processing table ${tableName}: ${tableError instanceof Error ? tableError.message : 'Unknown error'}`);
        }
      }
    }

    // Step 4: Validate schema was created successfully
    const { data: verifyData, error: verifyError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT COUNT(*) as table_count
        FROM information_schema.tables 
        WHERE table_schema = '${schemaName}'
      `
    });

    if (verifyError) {
      errors.push(`Failed to verify schema creation: ${verifyError.message}`);
    } else {
      const tableCount = verifyData && Array.isArray(verifyData) && verifyData.length > 0 ? 
        verifyData[0].table_count : 0;
      logger.info(`Schema ${schemaName} created with ${tableCount} tables`);
    }

    const success = tablesCreated.length > 0 && errors.length === 0;
    return { success, schemaName, tablesCreated, errors };

  } catch (error) {
    errors.push(`Schema creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    logger.error(`Error creating schema ${schemaName}:`, error);
    return { success: false, schemaName, tablesCreated, errors };
  }
}

/**
 * Improved DDL comparison with better error handling
 */
export async function getTableDDL(schemaName: string): Promise<{
  success: boolean;
  ddl: string;
  tableCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let ddl = '';
  let tableCount = 0;

  try {
    // Get list of tables in the schema
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '${schemaName}' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `
    });

    if (tablesError) {
      errors.push(`Failed to get tables for schema ${schemaName}: ${tablesError.message}`);
      return { success: false, ddl, tableCount, errors };
    }

    if (!tables || !Array.isArray(tables)) {
      errors.push(`No tables found in schema ${schemaName}`);
      return { success: false, ddl, tableCount, errors };
    }

    tableCount = tables.length;
    logger.info(`Getting DDL for ${tableCount} tables in schema ${schemaName}`);

    // Get DDL for each table
    const ddlParts: string[] = [];
    for (const tableRow of tables) {
      if (tableRow && typeof tableRow === 'object' && 'table_name' in tableRow) {
        const tableName = (tableRow as { table_name: string }).table_name;
        
        try {
          const { data: tableDDL, error: ddlError } = await supabase.rpc('pg_get_tabledef', {
            p_schema: schemaName,
            p_table: tableName
          });

          if (ddlError) {
            errors.push(`Failed to get DDL for table ${tableName}: ${ddlError.message}`);
          } else if (tableDDL && tableDDL.trim() !== '') {
            ddlParts.push(tableDDL);
          } else {
            errors.push(`Empty DDL returned for table ${tableName}`);
          }
        } catch (tableError) {
          errors.push(`Error getting DDL for table ${tableName}: ${tableError instanceof Error ? tableError.message : 'Unknown error'}`);
        }
      }
    }

    ddl = ddlParts.join('\n\n');
    const success = ddl.trim() !== '' && errors.length === 0;
    
    logger.info(`Generated DDL for schema ${schemaName}: ${ddl.length} characters, ${ddlParts.length} tables`);
    
    return { success, ddl, tableCount, errors };

  } catch (error) {
    errors.push(`DDL generation failed for schema ${schemaName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    logger.error(`Error getting DDL for schema ${schemaName}:`, error);
    return { success: false, ddl, tableCount, errors };
  }
}

/**
 * Improved schema cleanup with better error handling
 */
export async function cleanupSchemaWithValidation(schemaName: string): Promise<{
  success: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    logger.info(`Cleaning up schema: ${schemaName}`);

    // Check if schema exists first
    const { data: existsData, error: existsError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = '${schemaName}'
      `
    });

    if (existsError) {
      errors.push(`Failed to check if schema exists: ${existsError.message}`);
      return { success: false, errors };
    }

    if (!existsData || !Array.isArray(existsData) || existsData.length === 0) {
      logger.info(`Schema ${schemaName} does not exist, no cleanup needed`);
      return { success: true, errors };
    }

    // Drop the schema with CASCADE
    const { error: dropError } = await supabase.rpc('exec_sql', {
      query: `DROP SCHEMA IF EXISTS ${schemaName} CASCADE`
    });

    if (dropError) {
      errors.push(`Failed to drop schema: ${dropError.message}`);
      return { success: false, errors };
    }

    // Verify schema was dropped
    const { data: verifyData, error: verifyError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = '${schemaName}'
      `
    });

    if (verifyError) {
      errors.push(`Failed to verify schema cleanup: ${verifyError.message}`);
    } else if (verifyData && Array.isArray(verifyData) && verifyData.length > 0) {
      errors.push(`Schema ${schemaName} still exists after cleanup attempt`);
    } else {
      logger.info(`Successfully cleaned up schema: ${schemaName}`);
    }

    return { success: errors.length === 0, errors };

  } catch (error) {
    errors.push(`Schema cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    logger.error(`Error cleaning up schema ${schemaName}:`, error);
    return { success: false, errors };
  }
}
