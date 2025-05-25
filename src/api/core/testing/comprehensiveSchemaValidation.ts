
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { logger } from '@/utils/logger';
import _ from 'lodash';

/**
 * Comprehensive schema structure interfaces
 */
export interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  column_default: string | null;
  character_maximum_length: number | null;
  numeric_precision: number | null;
  numeric_scale: number | null;
  ordinal_position: number;
}

export interface ConstraintInfo {
  constraint_name: string;
  constraint_type: string;
  table_name: string;
  column_names: string[];
  foreign_table_schema: string | null;
  foreign_table_name: string | null;
  foreign_column_names: string[] | null;
  check_clause: string | null;
}

export interface IndexInfo {
  index_name: string;
  table_name: string;
  index_definition: string;
  is_unique: boolean;
  is_primary: boolean;
  column_names: string[];
}

export interface TriggerInfo {
  trigger_name: string;
  table_name: string;
  event_manipulation: string;
  action_timing: string;
  action_statement: string;
}

export interface TableSchema {
  columns: { [columnName: string]: ColumnInfo };
  constraints: { [constraintName: string]: ConstraintInfo };
  indexes: { [indexName: string]: IndexInfo };
  triggers: { [triggerName: string]: TriggerInfo };
}

export interface SchemaStructure {
  tables: { [tableName: string]: TableSchema };
  metadata: {
    schema_name: string;
    extracted_at: string;
    table_count: number;
  };
}

export interface SchemaDifference {
  path: string;
  type: 'added' | 'removed' | 'changed';
  sourceValue?: any;
  targetValue?: any;
  description: string;
}

export interface ComprehensiveSchemaComparison {
  isEqual: boolean;
  differences: SchemaDifference[];
  summary: string;
  sourceSchema: SchemaStructure;
  targetSchema: SchemaStructure;
}

/**
 * Extract comprehensive schema structure using secure functions
 */
export async function extractSchemaStructure(schemaName: string): Promise<SchemaStructure> {
  try {
    logger.debug(`Extracting comprehensive schema structure for: ${schemaName}`);

    // Use the secure validate_schema_structure function to get basic info
    const serviceClient = TestClientFactory.getServiceRoleClient();
    const { data: schemaData, error: schemaError } = await serviceClient.rpc('validate_schema_structure', {
      target_schema: schemaName
    });

    if (schemaError) throw schemaError;

    const tables: { [tableName: string]: TableSchema } = {};
    const tableNames: string[] = [];

    // Extract table names from the secure function result
    if (schemaData && typeof schemaData === 'object' && 'tables' in schemaData) {
      const tablesArray = schemaData.tables;
      if (Array.isArray(tablesArray)) {
        tablesArray.forEach((table: any) => {
          if (table && typeof table === 'object' && 'table_name' in table) {
            tableNames.push(table.table_name);
          }
        });
      }
    }

    // Extract data for each table using the secure get_table_info function
    for (const tableName of tableNames) {
      tables[tableName] = await extractTableSchemaSecure(schemaName, tableName);
    }

    return {
      tables,
      metadata: {
        schema_name: schemaName,
        extracted_at: new Date().toISOString(),
        table_count: tableNames.length
      }
    };
  } catch (error) {
    logger.error(`Error extracting schema structure for ${schemaName}:`, error);
    throw error;
  }
}

/**
 * Extract table schema using secure functions
 */
async function extractTableSchemaSecure(schemaName: string, tableName: string): Promise<TableSchema> {
  const serviceClient = TestClientFactory.getServiceRoleClient();
  
  // Use the secure get_table_info function
  const { data: tableInfo, error: tableError } = await serviceClient.rpc('get_table_info', {
    p_schema: schemaName,
    p_table: tableName
  });

  if (tableError) throw tableError;

  const columns: { [columnName: string]: ColumnInfo } = {};
  
  // Process columns from secure function result
  if (tableInfo && typeof tableInfo === 'object' && 'columns' in tableInfo) {
    const columnsArray = tableInfo.columns;
    if (Array.isArray(columnsArray)) {
      columnsArray.forEach((col: any) => {
        if (col && typeof col === 'object' && 'column_name' in col) {
          columns[col.column_name] = {
            column_name: col.column_name,
            data_type: col.data_type || 'unknown',
            is_nullable: col.is_nullable === 'YES',
            column_default: col.column_default || null,
            character_maximum_length: col.character_maximum_length || null,
            numeric_precision: col.numeric_precision || null,
            numeric_scale: col.numeric_scale || null,
            ordinal_position: col.ordinal_position || 0
          };
        }
      });
    }
  }

  // For now, return simplified schema without constraints, indexes, and triggers
  // as these would require additional secure functions to be implemented
  return {
    columns,
    constraints: {},
    indexes: {},
    triggers: {}
  };
}

/**
 * Perform deep comparison of two schema structures
 */
export function compareSchemaStructures(
  sourceSchema: SchemaStructure,
  targetSchema: SchemaStructure
): ComprehensiveSchemaComparison {
  const differences: SchemaDifference[] = [];
  
  // Quick check if they're identical
  const isEqual = _.isEqual(sourceSchema, targetSchema);
  
  if (!isEqual) {
    // Find differences in tables
    findTableDifferences(sourceSchema, targetSchema, differences);
  }

  const summary = generateComparisonSummary(differences, sourceSchema, targetSchema);

  return {
    isEqual,
    differences,
    summary,
    sourceSchema,
    targetSchema
  };
}

/**
 * Find differences between table structures
 */
function findTableDifferences(
  sourceSchema: SchemaStructure,
  targetSchema: SchemaStructure,
  differences: SchemaDifference[]
): void {
  const sourceTables = Object.keys(sourceSchema.tables);
  const targetTables = Object.keys(targetSchema.tables);

  // Find missing tables
  const missingTables = sourceTables.filter(table => !targetTables.includes(table));
  const extraTables = targetTables.filter(table => !sourceTables.includes(table));

  missingTables.forEach(table => {
    differences.push({
      path: `tables.${table}`,
      type: 'removed',
      sourceValue: sourceSchema.tables[table],
      description: `Table '${table}' exists in source but not in target`
    });
  });

  extraTables.forEach(table => {
    differences.push({
      path: `tables.${table}`,
      type: 'added',
      targetValue: targetSchema.tables[table],
      description: `Table '${table}' exists in target but not in source`
    });
  });

  // Compare existing tables
  const commonTables = sourceTables.filter(table => targetTables.includes(table));
  commonTables.forEach(tableName => {
    const sourceTbl = sourceSchema.tables[tableName];
    const targetTbl = targetSchema.tables[tableName];
    
    if (!_.isEqual(sourceTbl, targetTbl)) {
      findTableStructureDifferences(tableName, sourceTbl, targetTbl, differences);
    }
  });
}

/**
 * Find differences within a specific table structure
 */
function findTableStructureDifferences(
  tableName: string,
  sourceTable: TableSchema,
  targetTable: TableSchema,
  differences: SchemaDifference[]
): void {
  // Compare columns
  if (!_.isEqual(sourceTable.columns, targetTable.columns)) {
    findObjectDifferences(
      `tables.${tableName}.columns`,
      sourceTable.columns,
      targetTable.columns,
      differences,
      'column'
    );
  }

  // Compare constraints
  if (!_.isEqual(sourceTable.constraints, targetTable.constraints)) {
    findObjectDifferences(
      `tables.${tableName}.constraints`,
      sourceTable.constraints,
      targetTable.constraints,
      differences,
      'constraint'
    );
  }

  // Compare indexes
  if (!_.isEqual(sourceTable.indexes, targetTable.indexes)) {
    findObjectDifferences(
      `tables.${tableName}.indexes`,
      sourceTable.indexes,
      targetTable.indexes,
      differences,
      'index'
    );
  }

  // Compare triggers
  if (!_.isEqual(sourceTable.triggers, targetTable.triggers)) {
    findObjectDifferences(
      `tables.${tableName}.triggers`,
      sourceTable.triggers,
      targetTable.triggers,
      differences,
      'trigger'
    );
  }
}

/**
 * Find differences between two objects (columns, constraints, etc.)
 */
function findObjectDifferences(
  basePath: string,
  sourceObjects: { [key: string]: any },
  targetObjects: { [key: string]: any },
  differences: SchemaDifference[],
  objectType: string
): void {
  const sourceKeys = Object.keys(sourceObjects);
  const targetKeys = Object.keys(targetObjects);

  // Find missing objects
  const missingKeys = sourceKeys.filter(key => !targetKeys.includes(key));
  const extraKeys = targetKeys.filter(key => !sourceKeys.includes(key));

  missingKeys.forEach(key => {
    differences.push({
      path: `${basePath}.${key}`,
      type: 'removed',
      sourceValue: sourceObjects[key],
      description: `${objectType} '${key}' exists in source but not in target`
    });
  });

  extraKeys.forEach(key => {
    differences.push({
      path: `${basePath}.${key}`,
      type: 'added',
      targetValue: targetObjects[key],
      description: `${objectType} '${key}' exists in target but not in source`
    });
  });

  // Find changed objects
  const commonKeys = sourceKeys.filter(key => targetKeys.includes(key));
  commonKeys.forEach(key => {
    if (!_.isEqual(sourceObjects[key], targetObjects[key])) {
      differences.push({
        path: `${basePath}.${key}`,
        type: 'changed',
        sourceValue: sourceObjects[key],
        targetValue: targetObjects[key],
        description: `${objectType} '${key}' has different properties`
      });
    }
  });
}

/**
 * Generate a human-readable summary of the comparison
 */
function generateComparisonSummary(
  differences: SchemaDifference[],
  sourceSchema: SchemaStructure,
  targetSchema: SchemaStructure
): string {
  if (differences.length === 0) {
    return `Schemas are identical. Both contain ${sourceSchema.metadata.table_count} tables.`;
  }

  const summary = [`Schema comparison found ${differences.length} differences:`];
  
  const grouped = _.groupBy(differences, 'type');
  
  if (grouped.added) {
    summary.push(`- ${grouped.added.length} additions`);
  }
  if (grouped.removed) {
    summary.push(`- ${grouped.removed.length} removals`);
  }
  if (grouped.changed) {
    summary.push(`- ${grouped.changed.length} modifications`);
  }

  summary.push('');
  summary.push('First 10 differences:');
  
  differences.slice(0, 10).forEach(diff => {
    summary.push(`  • ${diff.description}`);
  });

  if (differences.length > 10) {
    summary.push(`  ... and ${differences.length - 10} more differences`);
  }

  return summary.join('\n');
}

/**
 * Main validation function using comprehensive comparison
 */
export async function validateSchemaReplicationComprehensive(
  sourceSchema: string = 'public',
  testSchema: string
): Promise<ComprehensiveSchemaComparison> {
  try {
    logger.debug(`Performing comprehensive schema validation: ${sourceSchema} vs ${testSchema}`);
    
    const [sourceStructure, targetStructure] = await Promise.all([
      extractSchemaStructure(sourceSchema),
      extractSchemaStructure(testSchema)
    ]);

    const comparison = compareSchemaStructures(sourceStructure, targetStructure);
    
    logger.info(`Comprehensive schema validation completed. Equal: ${comparison.isEqual}, Differences: ${comparison.differences.length}`);
    
    return comparison;
  } catch (error) {
    logger.error('Error in comprehensive schema validation:', error);
    throw error;
  }
}
