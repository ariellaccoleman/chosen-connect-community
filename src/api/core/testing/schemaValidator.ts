
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { logger } from '@/utils/logger';
import {
  validateSchemaInfrastructure,
  getTableDDL
} from './schemaInfrastructureFixes';

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
 * Validate infrastructure before creating test schemas
 */
export async function validateInfrastructure(): Promise<{
  success: boolean;
  errors: string[];
}> {
  try {
    logger.info('Validating schema infrastructure...');
    const infraValidation = await validateSchemaInfrastructure();
    
    const errors: string[] = [];
    
    if (!infraValidation.execSqlWorking) {
      errors.push('exec_sql function not working');
    }
    
    if (!infraValidation.publicSchemaHasTables) {
      errors.push('Public schema has no tables');
    }
    
    if (!infraValidation.pgGetTabledefWorking) {
      errors.push('pg_get_tabledef function not working (schema validation may fail)');
    }
    
    if (infraValidation.errors && infraValidation.errors.length > 0) {
      errors.push(...infraValidation.errors);
    }
    
    const success = infraValidation.execSqlWorking && infraValidation.publicSchemaHasTables;
    
    if (!success) {
      logger.error('Schema infrastructure validation failed:', errors);
    } else {
      logger.info('Schema infrastructure validation passed');
    }
    
    return { success, errors };
  } catch (error) {
    logger.error('Error validating infrastructure:', error);
    return { 
      success: false, 
      errors: [`Infrastructure validation error: ${error}`] 
    };
  }
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

/**
 * Validate schema structure matches expected format
 */
export async function validateSchemaStructure(
  schema: string,
  expectedTables: string[] = []
): Promise<{
  success: boolean;
  errors: string[];
  tableCount: number;
  missingTables: string[];
}> {
  try {
    const isValid = await verifySchemaSetup(schema, {
      requiredTables: expectedTables,
      validateStructure: true
    });
    
    if (!isValid) {
      return {
        success: false,
        errors: ['Schema structure validation failed'],
        tableCount: 0,
        missingTables: expectedTables
      };
    }
    
    return {
      success: true,
      errors: [],
      tableCount: expectedTables.length,
      missingTables: []
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Schema structure validation error: ${error}`],
      tableCount: 0,
      missingTables: expectedTables
    };
  }
}
