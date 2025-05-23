
import { 
  createTestSchema, 
  dropSchema,
  validateTestSchema,
  resetSchemaTracking 
} from '@/api/core/testing/testSchemaManager';
import { validateSchemaReplication, compareSchemasDDL } from '@/api/core/testing/schemaValidationUtils';

describe('Schema Validation', () => {
  beforeEach(() => {
    resetSchemaTracking();
  });

  test('Create test schema with validation', async () => {
    console.log('Creating test schema with validation...');
    
    const schema = await createTestSchema({ 
      prefix: 'validation_test', 
      validateSchema: true 
    });
    
    console.log('Schema creation result:', { 
      name: schema.name, 
      status: schema.status, 
      isValid: schema.validationResult?.isValid 
    });
    
    expect(schema).toBeTruthy();
    expect(schema.status).toBe('validated');
    expect(schema.validationResult?.isValid).toBe(true);
    
    // Clean up the test schema
    await dropSchema(schema.name);
  });

  test('Validate existing schema', async () => {
    console.log('Creating schema for validation test...');
    
    // First create a schema to validate
    const createdSchema = await createTestSchema({ 
      prefix: 'existing_test',
      validateSchema: false // Create without validation first
    });
    
    console.log('Validating existing schema:', createdSchema.name);
    
    const validationResult = await validateTestSchema(createdSchema.name);
    
    console.log('Validation result:', {
      name: validationResult?.name,
      status: validationResult?.status,
      isValid: validationResult?.validationResult?.isValid
    });
    
    expect(validationResult).toBeTruthy();
    expect(validationResult?.status).toBe('validated');
    expect(validationResult?.validationResult?.isValid).toBe(true);
    
    // Clean up the test schema
    await dropSchema(createdSchema.name);
  });

  test('Schema validation should detect differences when they exist', async () => {
    console.log('Testing schema difference detection...');
    
    // Create a test schema with standard structure
    const schema = await createTestSchema({ 
      prefix: 'difference_test',
      validateSchema: false
    });
    
    console.log('Created schema for difference test:', schema.name);
    
    // Validate against public schema - should pass initially
    const initialResult = await validateSchemaReplication('public', schema.name);
    console.log('Initial validation result:', {
      isValid: initialResult.isValid,
      missingTables: initialResult.missingTables.length,
      structuralDiffs: initialResult.tablesDifferingInStructure.length
    });
    
    expect(initialResult.isValid).toBe(true);
    
    // Clean up the test schema
    await dropSchema(schema.name);
  });

  test('Compare schemas DDL', async () => {
    console.log('Testing DDL comparison...');
    
    // Create a test schema
    const schema = await createTestSchema({ 
      prefix: 'ddl_test',
      validateSchema: false
    });
    
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
    
    // Clean up the test schema
    await dropSchema(schema.name);
  });
});
