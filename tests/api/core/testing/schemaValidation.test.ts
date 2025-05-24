import { 
  createTestSchema, 
  dropSchema,
  validateTestSchema,
  resetSchemaTracking,
  forceCleanupAllTestSchemas
} from '@/api/core/testing/testSchemaManager';
import { 
  validateSchemaReplication, 
  compareSchemasDDL,
  compareSchemasDDLEnhanced
} from '@/api/core/testing/schemaValidationUtils';
import { 
  validateSchemaReplicationComprehensive,
  extractSchemaStructure,
  compareSchemaStructures
} from '@/api/core/testing/comprehensiveSchemaValidation';

describe('Schema Validation', () => {
  const createdSchemas: string[] = [];

  beforeEach(() => {
    resetSchemaTracking();
  });

  afterEach(async () => {
    // Clean up any schemas created during this test
    for (const schemaName of createdSchemas) {
      try {
        await dropSchema(schemaName);
      } catch (error) {
        console.warn(`Failed to cleanup schema ${schemaName}:`, error);
      }
    }
    createdSchemas.length = 0; // Clear the array
  });

  afterAll(async () => {
    // Force cleanup all test schemas as a safety net
    await forceCleanupAllTestSchemas();
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
    
    const result = await compareSchemasDDLEnhanced('public', schema.name);
    
    console.log('Enhanced DDL comparison result:', {
      sourceLength: result.source.length,
      targetLength: result.target.length,
      hasComprehensive: !!result.comprehensive,
      comprehensiveEqual: result.comprehensive?.isEqual,
      comprehensiveDifferences: result.comprehensive?.differences.length || 0
    });
    
    expect(result.source).toBeTruthy();
    expect(result.target).toBeTruthy();
    expect(result.source).toContain('CREATE TABLE');
    expect(result.target).toContain('CREATE TABLE');
    
    if (result.comprehensive) {
      expect(result.comprehensive.isEqual).toBe(true);
      expect(result.comprehensive.differences).toHaveLength(0);
    }
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
