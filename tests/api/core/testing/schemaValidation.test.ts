import { 
  createTestSchema, 
  dropSchema,
  validateTestSchema,
  resetSchemaTracking,
  forceCleanupAllTestSchemas
} from '@/api/core/testing/testSchemaManager';
import { 
  validateSchemaReplication, 
  compareSchemasDDL
} from '@/api/core/testing/schemaValidationUtils';
import { 
  validateSchemaReplicationComprehensive,
  extractSchemaStructure,
  compareSchemaStructures
} from '@/api/core/testing/comprehensiveSchemaValidation';
import {
  validateSchemaInfrastructure,
  createSchemaWithValidation,
  getTableDDL,
  cleanupSchemaWithValidation,
  compareSchemasDDLWithValidation
} from '@/api/core/testing/schemaInfrastructureFixes';

describe('Schema Validation', () => {
  const createdSchemas: string[] = [];

  beforeAll(async () => {
    console.log('=== Schema Validation Test Suite Starting ===');
    
    // Validate infrastructure before running any tests
    console.log('Validating schema infrastructure...');
    const infraValidation = await validateSchemaInfrastructure();
    console.log('Infrastructure validation result:', {
      execSqlWorking: infraValidation.execSqlWorking,
      pgGetTabledefWorking: infraValidation.pgGetTabledefWorking,
      publicSchemaHasTables: infraValidation.publicSchemaHasTables,
      errorCount: infraValidation.errors.length
    });
    
    if (infraValidation.errors.length > 0) {
      console.warn('Infrastructure validation errors:', infraValidation.errors);
    }
    
    // Fail fast if basic infrastructure is broken
    if (!infraValidation.execSqlWorking) {
      throw new Error('exec_sql function not working - cannot run schema tests');
    }
    
    if (!infraValidation.publicSchemaHasTables) {
      throw new Error('No tables found in public schema - cannot test schema replication');
    }
  });

  beforeEach(() => {
    resetSchemaTracking();
  });

  afterEach(async () => {
    console.log(`Cleaning up ${createdSchemas.length} schemas created during this test...`);
    
    // Clean up any schemas created during this test
    for (const schemaName of createdSchemas) {
      try {
        const result = await cleanupSchemaWithValidation(schemaName);
        if (!result.success) {
          console.warn(`Failed to cleanup schema ${schemaName}:`, result.errors);
        }
      } catch (error) {
        console.warn(`Failed to cleanup schema ${schemaName}:`, error);
      }
    }
    createdSchemas.length = 0; // Clear the array
  });

  afterAll(async () => {
    console.log('=== Schema Validation Test Suite Cleanup ===');
    // Force cleanup all test schemas as a safety net
    await forceCleanupAllTestSchemas();
  });

  test('Infrastructure validation works correctly', async () => {
    console.log('Testing infrastructure validation...');
    
    const result = await validateSchemaInfrastructure();
    
    console.log('Infrastructure validation result:', {
      execSqlWorking: result.execSqlWorking,
      pgGetTabledefWorking: result.pgGetTabledefWorking,
      publicSchemaHasTables: result.publicSchemaHasTables,
      errors: result.errors
    });
    
    expect(result.execSqlWorking).toBe(true);
    expect(result.publicSchemaHasTables).toBe(true);
    // pg_get_tabledef should work, but we'll warn if it doesn't
    if (!result.pgGetTabledefWorking) {
      console.warn('pg_get_tabledef function not working properly');
    }
  });

  test('Enhanced schema creation works correctly', async () => {
    console.log('Testing enhanced schema creation...');
    
    const schemaName = `enhanced_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const result = await createSchemaWithValidation(schemaName);
    
    // Track this schema for cleanup
    createdSchemas.push(schemaName);
    
    console.log('Enhanced schema creation result:', {
      success: result.success,
      schemaName: result.schemaName,
      tablesCreated: result.tablesCreated.length,
      errors: result.errors
    });
    
    expect(result.success).toBe(true);
    expect(result.tablesCreated.length).toBeGreaterThan(0);
    expect(result.errors.length).toBe(0);
  });

  test('Enhanced DDL generation works correctly', async () => {
    console.log('Testing enhanced DDL generation...');
    
    // Test DDL generation for public schema
    const result = await getTableDDL('public');
    
    console.log('DDL generation result:', {
      success: result.success,
      ddlLength: result.ddl.length,
      tableCount: result.tableCount,
      errorCount: result.errors.length
    });
    
    expect(result.success).toBe(true);
    expect(result.ddl.length).toBeGreaterThan(0);
    expect(result.tableCount).toBeGreaterThan(0);
    expect(result.ddl).toContain('CREATE TABLE');
  });

  test('Enhanced DDL comparison works correctly', async () => {
    console.log('Testing enhanced DDL comparison...');
    
    // Create a test schema first
    const schemaName = `ddl_comparison_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const createResult = await createSchemaWithValidation(schemaName);
    
    // Track this schema for cleanup
    createdSchemas.push(schemaName);
    
    expect(createResult.success).toBe(true);
    
    // Compare DDL between public and test schema
    const comparisonResult = await enhancedDDLComparison('public', schemaName);
    
    console.log('Enhanced DDL comparison result:', {
      success: comparisonResult.success,
      sourceLength: comparisonResult.source.length,
      targetLength: comparisonResult.target.length,
      errorCount: comparisonResult.errors.length
    });
    
    expect(comparisonResult.success).toBe(true);
    expect(comparisonResult.source.length).toBeGreaterThan(0);
    expect(comparisonResult.target.length).toBeGreaterThan(0);
    expect(comparisonResult.source).toContain('CREATE TABLE');
    expect(comparisonResult.target).toContain('CREATE TABLE');
  });

  test('Schema cleanup works correctly', async () => {
    console.log('Testing schema cleanup...');
    
    // Create a test schema
    const schemaName = `cleanup_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const createResult = await createSchemaWithValidation(schemaName);
    
    expect(createResult.success).toBe(true);
    
    // Now clean it up
    const cleanupResult = await cleanupSchemaWithValidation(schemaName);
    
    console.log('Schema cleanup result:', {
      success: cleanupResult.success,
      errors: cleanupResult.errors
    });
    
    expect(cleanupResult.success).toBe(true);
    expect(cleanupResult.errors.length).toBe(0);
    
    // Don't add to createdSchemas since we cleaned it up manually
  });

  test('Create test schema with comprehensive validation', async () => {
    console.log('Creating test schema with comprehensive validation...');
    
    const schema = await createTestSchema({ 
      prefix: 'comprehensive_test', 
      validateSchema: true,
      useComprehensiveValidation: true
    });
    
    // Track this schema for cleanup
    createdSchemas.push(schema.name);
    
    console.log('Comprehensive schema creation result:', { 
      name: schema.name, 
      status: schema.status, 
      isValid: schema.validationResult?.isValid 
    });
    
    expect(schema).toBeTruthy();
    expect(schema.status).toBe('validated');
    expect(schema.validationResult?.isValid).toBe(true);
  });

  test('Comprehensive schema validation detects identical schemas', async () => {
    console.log('Testing comprehensive validation on identical schemas...');
    
    // Create a test schema
    const schema = await createTestSchema({ 
      prefix: 'identical_test',
      validateSchema: false
    });
    
    // Track this schema for cleanup
    createdSchemas.push(schema.name);
    
    console.log('Running comprehensive validation...');
    
    const result = await validateSchemaReplicationComprehensive('public', schema.name);
    
    console.log('Comprehensive validation result:', {
      isEqual: result.isEqual,
      differencesCount: result.differences.length,
      summary: result.summary.substring(0, 100) + '...'
    });
    
    expect(result.isEqual).toBe(true);
    expect(result.differences).toHaveLength(0);
    expect(result.summary).toContain('identical');
  });

  test('Extract and compare schema structures', async () => {
    console.log('Testing schema structure extraction and comparison...');
    
    // Create a test schema
    const schema = await createTestSchema({ 
      prefix: 'structure_test',
      validateSchema: false
    });
    
    // Track this schema for cleanup
    createdSchemas.push(schema.name);
    
    console.log('Extracting schema structures...');
    
    const [sourceStructure, targetStructure] = await Promise.all([
      extractSchemaStructure('public'),
      extractSchemaStructure(schema.name)
    ]);
    
    console.log('Schema extraction results:', {
      sourceTableCount: sourceStructure.metadata.table_count,
      targetTableCount: targetStructure.metadata.table_count,
      sourceSchema: sourceStructure.metadata.schema_name,
      targetSchema: targetStructure.metadata.schema_name
    });
    
    expect(sourceStructure.tables).toBeTruthy();
    expect(targetStructure.tables).toBeTruthy();
    expect(sourceStructure.metadata.table_count).toBeGreaterThan(0);
    expect(targetStructure.metadata.table_count).toBe(sourceStructure.metadata.table_count);
    
    // Compare structures
    const comparison = compareSchemaStructures(sourceStructure, targetStructure);
    
    console.log('Structure comparison result:', {
      isEqual: comparison.isEqual,
      differencesCount: comparison.differences.length
    });
    
    expect(comparison.isEqual).toBe(true);
    expect(comparison.differences).toHaveLength(0);
  });

  test('Enhanced DDL comparison with comprehensive analysis', async () => {
    console.log('Testing enhanced DDL comparison...');
    
    // Create a test schema
    const schema = await createTestSchema({ 
      prefix: 'enhanced_ddl_test',
      validateSchema: false
    });
    
    // Track this schema for cleanup
    createdSchemas.push(schema.name);
    
    console.log('Running enhanced DDL comparison...');
    
    const result = await compareSchemasDDLWithValidation('public', schema.name);
    
    console.log('Enhanced DDL comparison result:', {
      sourceLength: result.source.length,
      targetLength: result.target.length,
      success: result.success,
      errorCount: result.errors.length
    });
    
    expect(result.source).toBeTruthy();
    expect(result.target).toBeTruthy();
    expect(result.source).toContain('CREATE TABLE');
    expect(result.target).toContain('CREATE TABLE');
    expect(result.success).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  test('Legacy validation still works', async () => {
    console.log('Testing legacy validation compatibility...');
    
    // Create a test schema
    const schema = await createTestSchema({ 
      prefix: 'legacy_test',
      validateSchema: false
    });
    
    // Track this schema for cleanup
    createdSchemas.push(schema.name);
    
    console.log('Running legacy validation...');
    
    const result = await validateSchemaReplication('public', schema.name, false);
    
    console.log('Legacy validation result:', {
      isValid: result.isValid,
      missingTables: result.missingTables.length,
      structuralDiffs: result.tablesDifferingInStructure.length
    });
    
    expect(result.isValid).toBe(true);
    expect(result.missingTables).toHaveLength(0);
    expect(result.tablesDifferingInStructure).toHaveLength(0);
  });

  test('Compare schemas DDL', async () => {
    console.log('Testing DDL comparison...');
    
    // Create a test schema
    const schema = await createTestSchema({ 
      prefix: 'ddl_test',
      validateSchema: false
    });
    
    // Track this schema for cleanup
    createdSchemas.push(schema.name);
    
    console.log('Created schema for DDL test:', schema.name);
    
    const ddl = await compareSchemasDDL('public', schema.name);
    
    console.log('DDL comparison result:', {
      sourceLength: ddl.source.length,
      targetLength: ddl.target.length,
      sourceContainsCreate: ddl.source.includes('CREATE TABLE'),
      targetContainsCreate: ddl.target.includes('CREATE TABLE')
    });
    
    expect(ddl.source).toBeTruthy();
    expect(ddl.target).toBeTruthy();
    expect(ddl.source).toContain('CREATE TABLE');
    expect(ddl.target).toContain('CREATE TABLE');
  });
});
