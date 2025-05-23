
import { 
  createTestSchema, 
  dropSchema,
  validateTestSchema,
  resetSchemaTracking 
} from '@/api/core/testing/testSchemaManager';
import { validateSchemaReplication, compareSchemasDDL } from '@/api/core/testing/schemaValidationUtils';

// Mock the supabase client
jest.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      rpc: jest.fn().mockImplementation((func, args) => {
        if (func === 'exec_sql' && args.query.includes('information_schema.schemata')) {
          return Promise.resolve({ data: [{ schema_name: 'test_schema' }], error: null });
        } else if (func === 'exec_sql' && args.query.includes('information_schema.tables')) {
          return Promise.resolve({ 
            data: [
              { table_name: 'profiles' },
              { table_name: 'organizations' }
            ], 
            error: null 
          });
        } else if (func === 'pg_get_tabledef') {
          const tableDef = `CREATE TABLE public.${args.p_table} (id UUID PRIMARY KEY, name TEXT);`;
          return Promise.resolve({ data: tableDef, error: null });
        } else if (func === 'exec_sql' && args.query.includes('information_schema.columns')) {
          return Promise.resolve({ 
            data: [
              { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()' },
              { column_name: 'name', data_type: 'text', is_nullable: 'YES', column_default: null }
            ],
            error: null 
          });
        } else if (func === 'exec_sql' && args.query.includes('information_schema.table_constraints')) {
          return Promise.resolve({ 
            data: [
              { constraint_name: 'pk_id', constraint_type: 'PRIMARY KEY', definition: 'PRIMARY KEY (id)' }
            ],
            error: null 
          });
        } else if (func === 'exec_sql' && args.query.includes('pg_index')) {
          return Promise.resolve({ 
            data: [
              { index_name: 'idx_name', definition: 'CREATE INDEX idx_name ON table_name(name)' }
            ],
            error: null 
          });
        } else {
          return Promise.resolve({ data: [], error: null });
        }
      })
    }
  };
});

describe('Schema Validation', () => {
  beforeEach(() => {
    resetSchemaTracking();
    jest.clearAllMocks();
  });

  test('Create test schema with validation', async () => {
    const schema = await createTestSchema({ 
      prefix: 'validation_test', 
      validateSchema: true 
    });
    
    expect(schema).toBeTruthy();
    expect(schema.status).toBe('validated');
    expect(schema.validationResult?.isValid).toBe(true);
  });

  test('Validate existing schema', async () => {
    const schemaName = 'test_existing_schema';
    const validationResult = await validateTestSchema(schemaName);
    
    expect(validationResult).toBeTruthy();
    expect(validationResult?.status).toBe('validated');
    expect(validationResult?.validationResult?.isValid).toBe(true);
  });

  test('Schema validation should detect differences', async () => {
    // Override the mock to simulate a schema with differences
    const supabaseMock = require('@/integrations/supabase/client').supabase;
    
    // Mock implementation that returns different column definitions for 'test_schema'
    const originalMock = supabaseMock.rpc;
    supabaseMock.rpc = jest.fn().mockImplementation((func, args) => {
      if (func === 'exec_sql' && args.query.includes('information_schema.columns')) {
        if (args.query.includes("table_schema = 'public'")) {
          return Promise.resolve({ 
            data: [
              { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()' },
              { column_name: 'name', data_type: 'text', is_nullable: 'YES', column_default: null },
              { column_name: 'description', data_type: 'text', is_nullable: 'YES', column_default: null }
            ],
            error: null 
          });
        } else {
          return Promise.resolve({ 
            data: [
              { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()' },
              { column_name: 'name', data_type: 'varchar', is_nullable: 'YES', column_default: null }
            ],
            error: null 
          });
        }
      } else {
        return originalMock(func, args);
      }
    });
    
    const result = await validateSchemaReplication('public', 'test_schema');
    
    expect(result.isValid).toBe(false);
    expect(result.tablesDifferingInStructure.length).toBeGreaterThan(0);
    expect(result.tablesDifferingInStructure[0].issues).toContain(expect.stringMatching(/data type/));
    expect(result.tablesDifferingInStructure[0].issues).toContain(expect.stringMatching(/Missing column/));
  });

  test('Compare schemas DDL', async () => {
    const ddl = await compareSchemasDDL('public', 'test_schema');
    
    expect(ddl.source).toBeTruthy();
    expect(ddl.target).toBeTruthy();
  });
});
