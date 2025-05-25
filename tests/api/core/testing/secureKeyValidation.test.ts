
import { TestClientFactory, TestInfrastructure } from '@/integrations/supabase/testClient';

describe('Secure Key Validation', () => {
  afterAll(() => {
    TestClientFactory.cleanup();
  });

  test('Service role client should only be used for infrastructure setup', async () => {
    console.log('=== Secure Key Validation Test ===');
    
    // Test that service role client works for infrastructure operations
    const serviceClient = TestClientFactory.getServiceRoleClient();
    expect(serviceClient).toBeTruthy();
    
    // Test schema validation using secure function
    try {
      const validation = await TestInfrastructure.validateSchema('public');
      console.log('Schema validation result:', {
        schema: validation.schema_name,
        tableCount: validation.table_count,
        hasValidationTime: !!validation.validated_at
      });
      
      expect(validation.schema_name).toBe('public');
      expect(validation.table_count).toBeGreaterThan(0);
      expect(validation.tables).toBeDefined();
      
    } catch (error) {
      console.error('Schema validation failed:', error);
      throw error;
    }
  });

  test('Anonymous client should be used for application testing', async () => {
    console.log('=== Anonymous Client Test ===');
    
    // Test that anonymous client works for regular operations
    const anonClient = TestClientFactory.getAnonClient();
    expect(anonClient).toBeTruthy();
    
    // Test basic query that should work with RLS
    try {
      const { data, error } = await anonClient
        .from('profiles')
        .select('id, first_name, last_name')
        .limit(1);
      
      console.log('Anonymous client query result:', {
        error: error?.message || null,
        hasData: !!data,
        dataLength: data?.length || 0
      });
      
      // This should work (might return empty results due to RLS, but no error)
      expect(error).toBeNull();
      
    } catch (error) {
      console.error('Anonymous client test failed:', error);
      throw error;
    }
  });

  test('Test schema creation and deletion works securely', async () => {
    console.log('=== Secure Schema Management Test ===');
    
    let testSchemaName: string | null = null;
    
    try {
      // Create test schema
      testSchemaName = await TestInfrastructure.createTestSchema('validation_test');
      expect(testSchemaName).toMatch(/^validation_test_\d+_[a-z0-9]+$/);
      
      // Validate the created schema
      const validation = await TestInfrastructure.validateSchema(testSchemaName);
      expect(validation.schema_name).toBe(testSchemaName);
      expect(validation.table_count).toBe(0); // New schema should be empty
      
      console.log('Test schema management successful:', {
        created: testSchemaName,
        validated: validation.schema_name
      });
      
    } finally {
      // Clean up
      if (testSchemaName) {
        await TestInfrastructure.dropTestSchema(testSchemaName);
      }
    }
  });

  test('Test user creation works with proper permissions', async () => {
    console.log('=== Test User Management Test ===');
    
    let testUserId: string | null = null;
    
    try {
      // Create test user
      const testUser = await TestInfrastructure.createTestUser(
        `test_${Date.now()}@example.com`,
        'TestPassword123!',
        { created_for_testing: true }
      );
      
      testUserId = testUser.id;
      expect(testUser.email).toContain('test_');
      expect(testUser.id).toBeTruthy();
      
      // Test authentication with the created user
      const authClient = await TestClientFactory.createAuthenticatedClient(
        testUser.email,
        'TestPassword123!'
      );
      
      expect(authClient).toBeTruthy();
      
      console.log('Test user management successful:', {
        userId: testUser.id,
        email: testUser.email,
        canAuthenticate: true
      });
      
    } catch (error) {
      console.error('Test user management failed:', error);
      throw error;
    } finally {
      // Clean up
      if (testUserId) {
        await TestInfrastructure.deleteTestUser(testUserId);
      }
    }
  });
});
