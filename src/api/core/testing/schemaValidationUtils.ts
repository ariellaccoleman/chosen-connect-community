
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Table structure information
 */
interface TableStructure {
  columns: ColumnDefinition[];
  constraints: ConstraintDefinition[];
  indexes: IndexDefinition[];
}

/**
 * Column definition information
 */
interface ColumnDefinition {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default?: string | null;
}

/**
 * Constraint definition information
 */
interface ConstraintDefinition {
  constraint_name: string;
  constraint_type: string;
  definition: string;
}

/**
 * Index definition information
 */
interface IndexDefinition {
  index_name: string;
  definition: string;
}

/**
 * Schema comparison result
 */
export interface SchemaComparisonResult {
  isValid: boolean;
  missingTables: string[];
  tablesDifferingInStructure: Array<{
    table: string;
    issues: string[];
  }>;
  summary: string;
}

/**
 * Get all tables in a schema
 */
async function getSchemaTableNames(schemaName: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '${schemaName}'
        AND table_type = 'BASE TABLE'
      `
    });
    
    if (error) {
      throw error;
    }
    
    // Extract table names from the result
    return (data || []).map((row: any) => row.table_name);
  } catch (error) {
    logger.error(`Error fetching tables from schema ${schemaName}:`, error);
    return [];
  }
}

/**
 * Get detailed structure of a table
 */
async function getTableStructure(schema: string, tableName: string): Promise<TableStructure | null> {
  try {
    // Get columns
    const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
        FROM 
          information_schema.columns
        WHERE 
          table_schema = '${schema}' 
          AND table_name = '${tableName}'
        ORDER BY 
          ordinal_position
      `
    });
    
    if (columnsError) {
      throw columnsError;
    }
    
    // Get constraints
    const { data: constraints, error: constraintsError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT
          c.constraint_name,
          c.constraint_type,
          pg_get_constraintdef(con.oid) as definition
        FROM
          information_schema.table_constraints c
          JOIN pg_constraint con ON con.conname = c.constraint_name
          JOIN pg_class rel ON rel.oid = con.conrelid
          JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE
          nsp.nspname = '${schema}'
          AND rel.relname = '${tableName}'
      `
    });
    
    if (constraintsError) {
      throw constraintsError;
    }
    
    // Get indexes
    const { data: indexes, error: indexesError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT
          i.relname as index_name,
          pg_get_indexdef(i.oid) as definition
        FROM
          pg_index x
          JOIN pg_class i ON i.oid = x.indexrelid
          JOIN pg_class t ON t.oid = x.indrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE
          n.nspname = '${schema}'
          AND t.relname = '${tableName}'
          AND i.relkind = 'i'
      `
    });
    
    if (indexesError) {
      throw indexesError;
    }
    
    return {
      columns: columns || [],
      constraints: constraints || [],
      indexes: indexes || []
    };
  } catch (error) {
    logger.error(`Error getting structure for table ${schema}.${tableName}:`, error);
    return null;
  }
}

/**
 * Compare two table structures and identify differences
 */
function compareTableStructures(
  sourceStructure: TableStructure, 
  targetStructure: TableStructure
): string[] {
  const issues: string[] = [];
  
  // Compare columns
  const sourceColumns = new Map<string, ColumnDefinition>();
  sourceStructure.columns.forEach(col => sourceColumns.set(col.column_name, col));
  
  const targetColumns = new Map<string, ColumnDefinition>();
  targetStructure.columns.forEach(col => targetColumns.set(col.column_name, col));
  
  // Check for missing columns
  sourceColumns.forEach((sourceCol, colName) => {
    if (!targetColumns.has(colName)) {
      issues.push(`Missing column: ${colName}`);
    } else {
      const targetCol = targetColumns.get(colName)!;
      
      // Check data type
      if (sourceCol.data_type !== targetCol.data_type) {
        issues.push(`Column ${colName} has different data type: ${sourceCol.data_type} vs ${targetCol.data_type}`);
      }
      
      // Check nullability
      if (sourceCol.is_nullable !== targetCol.is_nullable) {
        issues.push(`Column ${colName} has different nullability: ${sourceCol.is_nullable} vs ${targetCol.is_nullable}`);
      }
    }
  });
  
  // Check for extra columns
  targetColumns.forEach((_, colName) => {
    if (!sourceColumns.has(colName)) {
      issues.push(`Extra column in target: ${colName}`);
    }
  });
  
  // Check primary key constraints
  const sourcePKs = sourceStructure.constraints
    .filter(c => c.constraint_type === 'PRIMARY KEY')
    .map(c => c.definition);
    
  const targetPKs = targetStructure.constraints
    .filter(c => c.constraint_type === 'PRIMARY KEY')
    .map(c => c.definition);
  
  if (sourcePKs.length !== targetPKs.length) {
    issues.push(`Different number of PRIMARY KEY constraints: ${sourcePKs.length} vs ${targetPKs.length}`);
  }
  
  return issues;
}

/**
 * Validate that a test schema properly replicates the source schema structure
 */
export async function validateSchemaReplication(
  sourceSchema: string = 'public',
  testSchema: string
): Promise<SchemaComparisonResult> {
  const result: SchemaComparisonResult = {
    isValid: true,
    missingTables: [],
    tablesDifferingInStructure: [],
    summary: ''
  };
  
  try {
    logger.debug(`Validating schema replication from ${sourceSchema} to ${testSchema}`);
    
    // Get all tables from source schema
    const sourceTables = await getSchemaTableNames(sourceSchema);
    const testTables = await getSchemaTableNames(testSchema);
    
    // Check for missing tables
    const testTableSet = new Set(testTables);
    for (const sourceTable of sourceTables) {
      if (!testTableSet.has(sourceTable)) {
        result.missingTables.push(sourceTable);
        result.isValid = false;
      }
    }
    
    // Compare table structures for tables that exist in both schemas
    for (const tableName of sourceTables) {
      if (testTableSet.has(tableName)) {
        const sourceStructure = await getTableStructure(sourceSchema, tableName);
        const testStructure = await getTableStructure(testSchema, tableName);
        
        if (sourceStructure && testStructure) {
          const issues = compareTableStructures(sourceStructure, testStructure);
          
          if (issues.length > 0) {
            result.tablesDifferingInStructure.push({
              table: tableName,
              issues
            });
            result.isValid = false;
          }
        }
      }
    }
    
    // Generate summary
    let summary = '';
    if (result.isValid) {
      summary = `Test schema ${testSchema} successfully validated against ${sourceSchema}. All ${sourceTables.length} tables properly replicated.`;
    } else {
      summary = `Schema validation failed:\n`;
      
      if (result.missingTables.length > 0) {
        summary += `- Missing tables: ${result.missingTables.join(', ')}\n`;
      }
      
      if (result.tablesDifferingInStructure.length > 0) {
        summary += `- Tables with structural differences: ${result.tablesDifferingInStructure.map(t => t.table).join(', ')}\n`;
        
        // Include details of first few tables with issues
        const detailedTables = result.tablesDifferingInStructure.slice(0, 3);
        detailedTables.forEach(table => {
          summary += `  * ${table.table}: ${table.issues.slice(0, 3).join('; ')}`;
          if (table.issues.length > 3) {
            summary += `; and ${table.issues.length - 3} more issues`;
          }
          summary += '\n';
        });
        
        if (result.tablesDifferingInStructure.length > 3) {
          summary += `  * And ${result.tablesDifferingInStructure.length - 3} more tables with issues\n`;
        }
      }
    }
    
    result.summary = summary;
    
    return result;
  } catch (error) {
    logger.error(`Error validating schema replication:`, error);
    return {
      isValid: false,
      missingTables: [],
      tablesDifferingInStructure: [],
      summary: `Schema validation failed due to an error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Create a validation test that verifies all tables in a test schema
 */
export async function runSchemaValidationTest(testSchema: string): Promise<SchemaComparisonResult> {
  const result = await validateSchemaReplication('public', testSchema);
  logger.info(`Schema validation result for ${testSchema}:`, result.summary);
  return result;
}

/**
 * Compare schema DDL (Data Definition Language) between source and target schemas
 */
export async function compareSchemasDDL(
  sourceSchema: string = 'public', 
  targetSchema: string
): Promise<{source: string, target: string}> {
  try {
    // This function gets the DDL for recreating tables in a schema
    const { data: sourceDDL, error: sourceError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT array_to_string(array_agg(table_ddl), E'\n\n') as schema_ddl
        FROM (
          SELECT 
            table_name,
            public.pg_get_tabledef('${sourceSchema}', table_name) as table_ddl
          FROM 
            information_schema.tables
          WHERE 
            table_schema = '${sourceSchema}'
            AND table_type = 'BASE TABLE'
          ORDER BY table_name
        ) tables
      `
    });
    
    if (sourceError) {
      throw sourceError;
    }
    
    // Get DDL for target schema
    const { data: targetDDL, error: targetError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT array_to_string(array_agg(table_ddl), E'\n\n') as schema_ddl
        FROM (
          SELECT 
            table_name,
            public.pg_get_tabledef('${targetSchema}', table_name) as table_ddl
          FROM 
            information_schema.tables
          WHERE 
            table_schema = '${targetSchema}'
            AND table_type = 'BASE TABLE'
          ORDER BY table_name
        ) tables
      `
    });
    
    if (targetError) {
      throw targetError;
    }
    
    return {
      source: (sourceDDL && sourceDDL.length > 0) ? sourceDDL[0].schema_ddl : '',
      target: (targetDDL && targetDDL.length > 0) ? targetDDL[0].schema_ddl : ''
    };
  } catch (error) {
    logger.error(`Error comparing schema DDL:`, error);
    return { source: '', target: '' };
  }
}
