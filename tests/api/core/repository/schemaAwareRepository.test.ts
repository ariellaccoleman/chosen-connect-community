
import { createSchemaAwareRepository } from '@/api/core/repository/schemaAwareRepositoryFactory';
import { supabase } from '@/integrations/supabase/client';
import { setupTestingSchema, cleanTestData, createTestTable } from '../../setup/setupTestSchema';

// Define a test entity type
interface TestEntity {
  id: string;
  name: string;
  description: string;
  created_at?: string;
}

describe('SchemaAwareRepository', () => {
  // Test data
  const testData: TestEntity = {
    id: '12345',
    name: 'Test Entity',
    description: 'This is a test entity for schema testing'
  };
  
  // Create a schema-aware repository for the test
  const repository = createSchemaAwareRepository<TestEntity>('test_entities');
  
  beforeAll(async () => {
    // Set up testing schema
    await setupTestingSchema();
    
    // Create a test table in the testing schema
    await createTestTable('test_entities', [
      { name: 'id', type: 'uuid', isPrimary: true, defaultValue: 'gen_random_uuid()' },
      { name: 'name', type: 'text', isRequired: true },
      { name: 'description', type: 'text' },
      { name: 'created_at', type: 'timestamp with time zone', defaultValue: 'now()' }
    ]);
  });
  
  beforeEach(async () => {
    // Clean test data before each test
    await cleanTestData();
  });
  
  afterAll(async () => {
    // Clean up all test data
    await cleanTestData();
  });
  
  test('inserts and retrieves an entity from the testing schema', async () => {
    // Insert test entity
    const insertResult = await repository.insert(testData).execute();
    
    // Log result for debugging
    console.log('Insert result:', insertResult);
    
    expect(insertResult.error).toBeNull();
    expect(insertResult.data).toBeDefined();
    
    // Retrieve entity by ID
    const result = await repository.select().eq('id', testData.id).single();
    
    // Verify data was correctly stored and retrieved
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data?.id).toBe(testData.id);
    expect(result.data?.name).toBe(testData.name);
    expect(result.data?.description).toBe(testData.description);
  });
  
  test('updates an entity in the testing schema', async () => {
    // Insert test entity
    await repository.insert(testData).execute();
    
    // Update the entity
    const updatedDescription = 'Updated description for testing';
    const updateResult = await repository
      .update({ description: updatedDescription })
      .eq('id', testData.id)
      .execute();
      
    expect(updateResult.error).toBeNull();
    
    // Retrieve updated entity
    const result = await repository.select().eq('id', testData.id).single();
    
    // Verify data was correctly updated
    expect(result.error).toBeNull();
    expect(result.data?.description).toBe(updatedDescription);
  });
  
  test('deletes an entity from the testing schema', async () => {
    // Insert test entity
    await repository.insert(testData).execute();
    
    // Delete the entity
    const deleteResult = await repository
      .delete()
      .eq('id', testData.id)
      .execute();
      
    expect(deleteResult.error).toBeNull();
    
    // Try to retrieve the deleted entity
    const result = await repository.select().eq('id', testData.id).maybeSingle();
    
    // Verify entity was deleted
    expect(result.error).toBeNull();
    expect(result.data).toBeNull();
  });
});
