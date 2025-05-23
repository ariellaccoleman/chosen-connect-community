import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { 
  EnhancedError, 
  OperationStepTracker, 
  ErrorCategory, 
  ErrorSeverity 
} from './errorTypes';

/**
 * Types for RPC responses
 */
interface TableRow {
  table_name: string;
}

interface CountRow {
  table_count: number;
}

/**
 * Transaction context for tracking schema creation operations
 */
interface SchemaTransaction {
  schemaName: string;
  createdTables: string[];
  isActive: boolean;
  startTime: Date;
}

/**
 * Test and validate core schema infrastructure functions
 */
export async function validateSchemaInfrastructure(): Promise<{
  execSqlWorking: boolean;
  pgGetTabledefWorking: boolean;
  publicSchemaHasTables: boolean;
  errors: string[];
  enhancedErrors?: EnhancedError[];
}> {
  const tracker = new OperationStepTracker('validateSchemaInfrastructure');
  const errors: string[] = [];
  const enhancedErrors: EnhancedError[] = [];
  let execSqlWorking = false;
  let pgGetTabledefWorking = false;
  let publicSchemaHasTables = false;

  try {
    // Test basic exec_sql function
    tracker.startStep('testing_exec_sql_function');
    logger.info('Testing exec_sql function...');
    
    try {
      const { data: testData, error: testError } = await supabase.rpc('exec_sql', {
        query: 'SELECT 1 as test_value'
      });
      
      if (testError) {
        const enhancedError = tracker.createError(testError);
        enhancedErrors.push(enhancedError);
        errors.push(`exec_sql function error: ${testError.message}`);
        logger.error('exec_sql test failed:', testError);
      } else {
        execSqlWorking = true;
        tracker.completeStep();
        logger.info('exec_sql function working correctly');
      }
    } catch (error) {
      const enhancedError = tracker.createError(error);
      enhancedErrors.push(enhancedError);
      errors.push(`exec_sql function error: ${enhancedError.message}`);
    }

    // Test if public schema has tables
    tracker.startStep('checking_public_schema_tables');
    logger.info('Checking public schema tables...');
    
    try {
      const { data: tablesData, error: tablesError } = await supabase.rpc('exec_sql', {
        query: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          LIMIT 5
        `
      }) as { data: TableRow[] | null; error: any };

      if (tablesError) {
        const enhancedError = tracker.createError(tablesError);
        enhancedErrors.push(enhancedError);
        errors.push(`Failed to query public schema tables: ${tablesError.message}`);
      } else if (!tablesData || tablesData.length === 0) {
        const error = new Error('No tables found in public schema');
        const enhancedError = tracker.createError(error);
        enhancedErrors.push(enhancedError);
        errors.push('No tables found in public schema');
      } else {
        publicSchemaHasTables = true;
        tracker.completeStep();
        logger.info(`Found ${tablesData.length} tables in public schema`);
        
        // Test pg_get_tabledef function
        tracker.startStep('testing_pg_get_tabledef_function', { 
          testTable: tablesData[0].table_name 
        });
        logger.info('Testing pg_get_tabledef function...');
        
        try {
          const testTableName = tablesData[0].table_name;
          
          const { data: ddlData, error: ddlError } = await supabase.rpc('pg_get_tabledef', {
            p_schema: 'public',
            p_table: testTableName
          });

          if (ddlError) {
            const enhancedError = tracker.createError(ddlError);
            enhancedErrors.push(enhancedError);
            errors.push(`pg_get_tabledef function error: ${ddlError.message}`);
            logger.error('pg_get_tabledef test failed:', ddlError);
          } else if (!ddlData || ddlData.trim() === '') {
            const error = new Error(`pg_get_tabledef returned empty DDL for table ${testTableName}`);
            const enhancedError = tracker.createError(error);
            enhancedErrors.push(enhancedError);
            errors.push(`pg_get_tabledef returned empty DDL for table ${testTableName}`);
          } else {
            pgGetTabledefWorking = true;
            tracker.completeStep();
            logger.info('pg_get_tabledef function working correctly');
            logger.debug('Sample DDL:', ddlData.substring(0, 100) + '...');
          }
        } catch (error) {
          const enhancedError = tracker.createError(error);
          enhancedErrors.push(enhancedError);
          errors.push(`pg_get_tabledef function error: ${enhancedError.message}`);
        }
      }
    } catch (error) {
      const enhancedError = tracker.createError(error);
      enhancedErrors.push(enhancedError);
      errors.push(`Public schema check error: ${enhancedError.message}`);
    }

  } catch (error) {
    const enhancedError = tracker.createError(error);
    enhancedErrors.push(enhancedError);
    errors.push(`Infrastructure validation error: ${enhancedError.message}`);
    logger.error('Schema infrastructure validation failed:', error);
  }

  return {
    execSqlWorking,
    pgGetTabledefWorking,
    publicSchemaHasTables,
    errors,
    enhancedErrors
  };
}

/**
 * Begin a schema transaction
 */
async function beginSchemaTransaction(schemaName: string): Promise<SchemaTransaction> {
  logger.info(`Beginning schema transaction for: ${schemaName}`);
  
  const transaction: SchemaTransaction = {
    schemaName,
    createdTables: [],
    isActive: true,
    startTime: new Date()
  };

  // Start a database transaction
  const { error: beginError } = await supabase.rpc('exec_sql', {
    query: 'BEGIN;'
  });

  if (beginError) {
    transaction.isActive = false;
    throw new Error(`Failed to begin transaction: ${beginError.message}`);
  }

  return transaction;
}

/**
 * Commit a schema transaction
 */
async function commitSchemaTransaction(transaction: SchemaTransaction): Promise<void> {
  if (!transaction.isActive) {
    logger.warn(`Attempting to commit inactive transaction for schema: ${transaction.schemaName}`);
    return;
  }

  logger.info(`Committing schema transaction for: ${transaction.schemaName}`);
  
  const { error: commitError } = await supabase.rpc('exec_sql', {
    query: 'COMMIT;'
  });

  if (commitError) {
    logger.error(`Failed to commit transaction: ${commitError.message}`);
    // Try to rollback on commit failure
    await rollbackSchemaTransaction(transaction);
    throw new Error(`Transaction commit failed: ${commitError.message}`);
  }

  transaction.isActive = false;
  const duration = new Date().getTime() - transaction.startTime.getTime();
  logger.info(`Schema transaction committed successfully in ${duration}ms`);
}

/**
 * Rollback a schema transaction
 */
async function rollbackSchemaTransaction(transaction: SchemaTransaction): Promise<void> {
  if (!transaction.isActive) {
    logger.warn(`Attempting to rollback inactive transaction for schema: ${transaction.schemaName}`);
    return;
  }

  logger.warn(`Rolling back schema transaction for: ${transaction.schemaName}`);
  
  try {
    const { error: rollbackError } = await supabase.rpc('exec_sql', {
      query: 'ROLLBACK;'
    });

    if (rollbackError) {
      logger.error(`Failed to rollback transaction: ${rollbackError.message}`);
    } else {
      logger.info(`Transaction rolled back successfully for schema: ${transaction.schemaName}`);
    }
  } catch (error) {
    logger.error(`Error during rollback for schema ${transaction.schemaName}:`, error);
  } finally {
    transaction.isActive = false;
  }
}

/**
 * Enhanced schema creation with transaction support and comprehensive error handling
 */
export async function createSchemaWithValidation(schemaName: string): Promise<{
  success: boolean;
  schemaName: string;
  tablesCreated: string[];
  errors: string[];
  enhancedErrors?: EnhancedError[];
  transaction?: SchemaTransaction;
}> {
  const tracker = new OperationStepTracker('createSchemaWithValidation', { schemaName });
  const errors: string[] = [];
  const enhancedErrors: EnhancedError[] = [];
  let transaction: SchemaTransaction | null = null;

  try {
    logger.info(`Creating schema with transaction support: ${schemaName}`);

    // Begin transaction
    tracker.startStep('beginning_transaction');
    try {
      transaction = await beginSchemaTransaction(schemaName);
      tracker.completeStep();
    } catch (error) {
      const enhancedError = tracker.createError(error);
      enhancedErrors.push(enhancedError);
      errors.push(`Failed to begin transaction: ${enhancedError.message}`);
      return { success: false, schemaName, tablesCreated: [], errors, enhancedErrors };
    }

    // Create the schema
    tracker.startStep('creating_schema');
    try {
      const { error: createError } = await supabase.rpc('exec_sql', {
        query: `CREATE SCHEMA IF NOT EXISTS ${schemaName};`
      });

      if (createError) {
        const enhancedError = tracker.createError(createError);
        enhancedErrors.push(enhancedError);
        errors.push(`Failed to create schema: ${createError.message}`);
        await rollbackSchemaTransaction(transaction);
        return { success: false, schemaName, tablesCreated: [], errors, enhancedErrors, transaction };
      }
      tracker.completeStep();
    } catch (error) {
      const enhancedError = tracker.createError(error);
      enhancedErrors.push(enhancedError);
      errors.push(`Schema creation error: ${enhancedError.message}`);
      await rollbackSchemaTransaction(transaction);
      return { success: false, schemaName, tablesCreated: [], errors, enhancedErrors, transaction };
    }

    // Get list of tables from public schema
    tracker.startStep('fetching_source_tables');
    let tables: TableRow[];
    try {
      const { data: tablesData, error: tablesError } = await supabase.rpc('exec_sql', {
        query: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `
      }) as { data: TableRow[] | null; error: any };

      if (tablesError) {
        const enhancedError = tracker.createError(tablesError);
        enhancedErrors.push(enhancedError);
        errors.push(`Failed to get public schema tables: ${tablesError.message}`);
        await rollbackSchemaTransaction(transaction);
        return { success: false, schemaName, tablesCreated: [], errors, enhancedErrors, transaction };
      }

      if (!tablesData || tablesData.length === 0) {
        const error = new Error('No tables found in public schema to replicate');
        const enhancedError = tracker.createError(error);
        enhancedErrors.push(enhancedError);
        errors.push('No tables found in public schema to replicate');
        await rollbackSchemaTransaction(transaction);
        return { success: false, schemaName, tablesCreated: [], errors, enhancedErrors, transaction };
      }

      tables = tablesData;
      tracker.completeStep();
      logger.info(`Found ${tables.length} tables to replicate in transaction`);
    } catch (error) {
      const enhancedError = tracker.createError(error);
      enhancedErrors.push(enhancedError);
      errors.push(`Error fetching source tables: ${enhancedError.message}`);
      await rollbackSchemaTransaction(transaction);
      return { success: false, schemaName, tablesCreated: [], errors, enhancedErrors, transaction };
    }

    // Create each table in the new schema
    for (const tableRow of tables) {
      const tableName = tableRow.table_name;
      tracker.startStep('replicating_table', { tableName });
      
      try {
        // Get table definition
        const { data: tableDef, error: defError } = await supabase.rpc('pg_get_tabledef', {
          p_schema: 'public',
          p_table: tableName
        });

        if (defError) {
          const enhancedError = tracker.createError(defError);
          enhancedErrors.push(enhancedError);
          errors.push(`Failed to get definition for table ${tableName}: ${defError.message}`);
          continue;
        }

        if (!tableDef || tableDef.trim() === '') {
          const error = new Error(`Empty DDL returned for table ${tableName}`);
          const enhancedError = tracker.createError(error);
          enhancedErrors.push(enhancedError);
          errors.push(`Empty DDL returned for table ${tableName}`);
          continue;
        }

        // Replace schema name in the definition
        const testTableDef = tableDef.replace(/public\./g, `${schemaName}.`);
        
        // Create table in test schema within transaction
        const { error: createTableError } = await supabase.rpc('exec_sql', {
          query: testTableDef
        });

        if (createTableError) {
          const enhancedError = tracker.createError(createTableError);
          enhancedErrors.push(enhancedError);
          errors.push(`Failed to create table ${tableName}: ${createTableError.message}`);
          await rollbackSchemaTransaction(transaction);
          return { success: false, schemaName, tablesCreated: transaction.createdTables, errors, enhancedErrors, transaction };
        } else {
          transaction.createdTables.push(tableName);
          tracker.completeStep();
          logger.debug(`Successfully created table ${tableName} in transaction`);
        }

      } catch (error) {
        const enhancedError = tracker.createError(error);
        enhancedErrors.push(enhancedError);
        errors.push(`Error processing table ${tableName}: ${enhancedError.message}`);
        await rollbackSchemaTransaction(transaction);
        return { success: false, schemaName, tablesCreated: transaction.createdTables, errors, enhancedErrors, transaction };
      }
    }

    // Validate schema before committing
    tracker.startStep('validating_schema_creation');
    try {
      const { data: verifyData, error: verifyError } = await supabase.rpc('exec_sql', {
        query: `
          SELECT COUNT(*) as table_count
          FROM information_schema.tables 
          WHERE table_schema = '${schemaName}'
        `
      }) as { data: CountRow[] | null; error: any };

      if (verifyError) {
        const enhancedError = tracker.createError(verifyError);
        enhancedErrors.push(enhancedError);
        errors.push(`Failed to verify schema creation: ${verifyError.message}`);
        await rollbackSchemaTransaction(transaction);
        return { success: false, schemaName, tablesCreated: transaction.createdTables, errors, enhancedErrors, transaction };
      }

      if (verifyData && verifyData.length > 0) {
        const tableCount = verifyData[0].table_count;
        if (tableCount !== transaction.createdTables.length) {
          const error = new Error(`Schema verification failed: expected ${transaction.createdTables.length} tables, found ${tableCount}`);
          const enhancedError = tracker.createError(error);
          enhancedErrors.push(enhancedError);
          errors.push(`Schema verification failed: expected ${transaction.createdTables.length} tables, found ${tableCount}`);
          await rollbackSchemaTransaction(transaction);
          return { success: false, schemaName, tablesCreated: transaction.createdTables, errors, enhancedErrors, transaction };
        }
      }
      tracker.completeStep();
    } catch (error) {
      const enhancedError = tracker.createError(error);
      enhancedErrors.push(enhancedError);
      errors.push(`Schema validation error: ${enhancedError.message}`);
      await rollbackSchemaTransaction(transaction);
      return { success: false, schemaName, tablesCreated: transaction.createdTables, errors, enhancedErrors, transaction };
    }

    // Commit the transaction
    tracker.startStep('committing_transaction');
    try {
      await commitSchemaTransaction(transaction);
      tracker.completeStep();
    } catch (error) {
      const enhancedError = tracker.createError(error);
      enhancedErrors.push(enhancedError);
      errors.push(`Transaction commit failed: ${enhancedError.message}`);
      return { success: false, schemaName, tablesCreated: transaction.createdTables, errors, enhancedErrors, transaction };
    }

    const success = transaction.createdTables.length > 0 && errors.length === 0;
    logger.info(`Schema ${schemaName} created successfully with ${transaction.createdTables.length} tables using transaction`);
    
    return { success, schemaName, tablesCreated: transaction.createdTables, errors, enhancedErrors, transaction };

  } catch (error) {
    const enhancedError = tracker.createError(error);
    enhancedErrors.push(enhancedError);
    errors.push(`Schema creation failed: ${enhancedError.message}`);
    logger.error(`Error creating schema ${schemaName}:`, error);
    
    if (transaction) {
      await rollbackSchemaTransaction(transaction);
    }
    
    return { success: false, schemaName, tablesCreated: transaction?.createdTables || [], errors, enhancedErrors, transaction };
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
    }) as { data: TableRow[] | null; error: any };

    if (tablesError) {
      errors.push(`Failed to get tables for schema ${schemaName}: ${tablesError.message}`);
      return { success: false, ddl, tableCount, errors };
    }

    if (!tables || tables.length === 0) {
      errors.push(`No tables found in schema ${schemaName}`);
      return { success: false, ddl, tableCount, errors };
    }

    tableCount = tables.length;
    logger.info(`Getting DDL for ${tableCount} tables in schema ${schemaName}`);

    // Get DDL for each table
    const ddlParts: string[] = [];
    for (const tableRow of tables) {
      const tableName = tableRow.table_name;
      
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
 * Enhanced schema cleanup with transaction support
 */
export async function cleanupSchemaWithValidation(schemaName: string): Promise<{
  success: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let transaction: SchemaTransaction | null = null;

  try {
    logger.info(`Cleaning up schema with transaction support: ${schemaName}`);

    // Check if schema exists first
    const { data: existsData, error: existsError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = '${schemaName}'
      `
    }) as { data: { schema_name: string }[] | null; error: any };

    if (existsError) {
      errors.push(`Failed to check if schema exists: ${existsError.message}`);
      return { success: false, errors };
    }

    if (!existsData || existsData.length === 0) {
      logger.info(`Schema ${schemaName} does not exist, no cleanup needed`);
      return { success: true, errors };
    }

    // Begin transaction for cleanup
    transaction = await beginSchemaTransaction(`cleanup_${schemaName}`);

    // Drop the schema with CASCADE within transaction
    const { error: dropError } = await supabase.rpc('exec_sql', {
      query: `DROP SCHEMA IF EXISTS ${schemaName} CASCADE`
    });

    if (dropError) {
      errors.push(`Failed to drop schema: ${dropError.message}`);
      await rollbackSchemaTransaction(transaction);
      return { success: false, errors };
    }

    // Verify schema was dropped before committing
    const { data: verifyData, error: verifyError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = '${schemaName}'
      `
    }) as { data: { schema_name: string }[] | null; error: any };

    if (verifyError) {
      errors.push(`Failed to verify schema cleanup: ${verifyError.message}`);
      await rollbackSchemaTransaction(transaction);
      return { success: false, errors };
    } 
    
    if (verifyData && verifyData.length > 0) {
      errors.push(`Schema ${schemaName} still exists after cleanup attempt`);
      await rollbackSchemaTransaction(transaction);
      return { success: false, errors };
    }

    // Commit the cleanup transaction
    await commitSchemaTransaction(transaction);
    logger.info(`Successfully cleaned up schema: ${schemaName}`);

    return { success: errors.length === 0, errors };

  } catch (error) {
    const errorMessage = `Schema cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    errors.push(errorMessage);
    logger.error(`Error cleaning up schema ${schemaName}:`, error);
    
    if (transaction) {
      await rollbackSchemaTransaction(transaction);
    }
    
    return { success: false, errors };
  }
}

/**
 * Enhanced DDL comparison with comprehensive validation - main implementation
 */
export async function compareSchemasDDLWithValidation(sourceSchema: string, targetSchema: string): Promise<{
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
