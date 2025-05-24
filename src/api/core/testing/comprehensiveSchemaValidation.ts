
import { supabase } from '@/integrations/supabase/client';
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
 * Extract comprehensive schema structure using information_schema
 */
export async function extractSchemaStructure(schemaName: string): Promise<SchemaStructure> {
  try {
    logger.debug(`Extracting comprehensive schema structure for: ${schemaName}`);

    // Get all tables in schema
    const { data: tablesData, error: tablesError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '${schemaName}' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `
    });

    if (tablesError) throw tablesError;

    const tableNames = (tablesData || []).map((row: any) => row.table_name);
    const tables: { [tableName: string]: TableSchema } = {};

    // Extract data for each table
    for (const tableName of tableNames) {
      tables[tableName] = await extractTableSchema(schemaName, tableName);
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
 * Extract comprehensive table schema information
 */
async function extractTableSchema(schemaName: string, tableName: string): Promise<TableSchema> {
  const [columns, constraints, indexes, triggers] = await Promise.all([
    extractTableColumns(schemaName, tableName),
    extractTableConstraints(schemaName, tableName),
    extractTableIndexes(schemaName, tableName),
    extractTableTriggers(schemaName, tableName)
  ]);

  return { columns, constraints, indexes, triggers };
}

/**
 * Extract column information
 */
async function extractTableColumns(schemaName: string, tableName: string): Promise<{ [columnName: string]: ColumnInfo }> {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        column_name,
        data_type,
        is_nullable::boolean,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        ordinal_position
      FROM information_schema.columns
      WHERE table_schema = '${schemaName}' AND table_name = '${tableName}'
      ORDER BY ordinal_position
    `
  });

  if (error) throw error;

  const columns: { [columnName: string]: ColumnInfo } = {};
  (data || []).forEach((row: any) => {
    columns[row.column_name] = {
      column_name: row.column_name,
      data_type: row.data_type,
      is_nullable: row.is_nullable === 'YES',
      column_default: row.column_default,
      character_maximum_length: row.character_maximum_length,
      numeric_precision: row.numeric_precision,
      numeric_scale: row.numeric_scale,
      ordinal_position: row.ordinal_position
    };
  });

  return columns;
}

/**
 * Extract constraint information
 */
async function extractTableConstraints(schemaName: string, tableName: string): Promise<{ [constraintName: string]: ConstraintInfo }> {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        tc.table_name,
        array_agg(kcu.column_name ORDER BY kcu.ordinal_position) as column_names,
        ccu.table_schema as foreign_table_schema,
        ccu.table_name as foreign_table_name,
        array_agg(ccu.column_name ORDER BY kcu.ordinal_position) as foreign_column_names,
        cc.check_clause
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name 
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
      LEFT JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
        AND tc.table_schema = cc.constraint_schema
      WHERE tc.table_schema = '${schemaName}' AND tc.table_name = '${tableName}'
      GROUP BY tc.constraint_name, tc.constraint_type, tc.table_name, 
               ccu.table_schema, ccu.table_name, cc.check_clause
      ORDER BY tc.constraint_name
    `
  });

  if (error) throw error;

  const constraints: { [constraintName: string]: ConstraintInfo } = {};
  (data || []).forEach((row: any) => {
    constraints[row.constraint_name] = {
      constraint_name: row.constraint_name,
      constraint_type: row.constraint_type,
      table_name: row.table_name,
      column_names: row.column_names || [],
      foreign_table_schema: row.foreign_table_schema,
      foreign_table_name: row.foreign_table_name,
      foreign_column_names: row.foreign_column_names,
      check_clause: row.check_clause
    };
  });

  return constraints;
}

/**
 * Extract index information
 */
async function extractTableIndexes(schemaName: string, tableName: string): Promise<{ [indexName: string]: IndexInfo }> {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        i.relname as index_name,
        t.relname as table_name,
        pg_get_indexdef(i.oid) as index_definition,
        ix.indisunique as is_unique,
        ix.indisprimary as is_primary,
        array_agg(a.attname ORDER BY a.attnum) as column_names
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      LEFT JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE n.nspname = '${schemaName}' AND t.relname = '${tableName}'
      GROUP BY i.relname, t.relname, i.oid, ix.indisunique, ix.indisprimary
      ORDER BY i.relname
    `
  });

  if (error) throw error;

  const indexes: { [indexName: string]: IndexInfo } = {};
  (data || []).forEach((row: any) => {
    indexes[row.index_name] = {
      index_name: row.index_name,
      table_name: row.table_name,
      index_definition: row.index_definition,
      is_unique: row.is_unique,
      is_primary: row.is_primary,
      column_names: row.column_names || []
    };
  });

  return indexes;
}

/**
 * Extract trigger information
 */
async function extractTableTriggers(schemaName: string, tableName: string): Promise<{ [triggerName: string]: TriggerInfo }> {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        trigger_name,
        event_object_table as table_name,
        event_manipulation,
        action_timing,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_schema = '${schemaName}' AND event_object_table = '${tableName}'
      ORDER BY trigger_name
    `
  });

  if (error) throw error;

  const triggers: { [triggerName: string]: TriggerInfo } = {};
  (data || []).forEach((row: any) => {
    triggers[row.trigger_name] = {
      trigger_name: row.trigger_name,
      table_name: row.table_name,
      event_manipulation: row.event_manipulation,
      action_timing: row.action_timing,
      action_statement: row.action_statement
    };
  });

  return triggers;
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
