import { createMockRepository } from '@/api/core/repository/MockRepository';
import { createRepository } from '@/api/core/repository/repositoryFactory';

// Test entity type
interface TestEntity {
  id: string;
  name: string;
  created_at: string;
}

describe.skip('Repository Pattern', () => {
  describe('Mock Repository', () => {
    const initialData: TestEntity[] = [
      { id: '1', name: 'Entity 1', created_at: new Date().toISOString() },
      { id: '2', name: 'Entity 2', created_at: new Date().toISOString() }
    ];
    
    test('creates mock repository with initial data', () => {
      const repo = createMockRepository<TestEntity>('test_entities', initialData);
      expect(repo.tableName).toBe('test_entities');
    });
    
    test('select query works with execute', async () => {
      const repo = createMockRepository<TestEntity>('test_entities', initialData);
      const result = await repo.select().execute();
      
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].name).toBe('Entity 1');
    });
    
    test('filtering with eq works', async () => {
      const repo = createMockRepository<TestEntity>('test_entities', initialData);
      const result = await repo.select().eq('id', '1').execute();
      
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].id).toBe('1');
    });
    
    test('single returns first matching item', async () => {
      const repo = createMockRepository<TestEntity>('test_entities', initialData);
      const result = await repo.select().eq('id', '2').single();
      
      expect(result.error).toBeNull();
      expect(result.data?.id).toBe('2');
    });
    
    test('maybeSingle returns null when no match', async () => {
      const repo = createMockRepository<TestEntity>('test_entities', initialData);
      const result = await repo.select().eq('id', 'non-existent').maybeSingle();
      
      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });
    
    test('insert adds new entity', async () => {
      const repo = createMockRepository<TestEntity>('test_entities', [...initialData]);
      const newEntity = { name: 'Entity 3', created_at: new Date().toISOString() };
      
      // Insert the entity
      const insertResult = await repo.insert(newEntity).single();
      expect(insertResult.error).toBeNull();
      expect(insertResult.data?.name).toBe('Entity 3');
      
      // Verify it was added
      const result = await repo.select().execute();
      expect(result.data).toHaveLength(3);
    });
    
    test('update modifies entity', async () => {
      const repo = createMockRepository<TestEntity>('test_entities', [...initialData]);
      
      // Update an entity
      const updateResult = await repo
        .update({ name: 'Updated Entity' })
        .eq('id', '1')
        .single();
        
      expect(updateResult.error).toBeNull();
      expect(updateResult.data?.name).toBe('Updated Entity');
      
      // Verify it was updated
      const result = await repo.select().eq('id', '1').single();
      expect(result.data?.name).toBe('Updated Entity');
    });
    
    test('delete removes entity', async () => {
      const repo = createMockRepository<TestEntity>('test_entities', [...initialData]);
      
      // Delete an entity
      const deleteResult = await repo
        .delete()
        .eq('id', '1')
        .execute();
        
      expect(deleteResult.error).toBeNull();
      
      // Verify it was deleted
      const result = await repo.select().execute();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].id).toBe('2');
    });
    
    test('ordering works', async () => {
      const data = [
        { id: '1', name: 'C', created_at: new Date().toISOString() },
        { id: '2', name: 'A', created_at: new Date().toISOString() },
        { id: '3', name: 'B', created_at: new Date().toISOString() }
      ];
      
      const repo = createMockRepository<TestEntity>('test_entities', data);
      
      // Order ascending
      const ascResult = await repo
        .select()
        .order('name', { ascending: true })
        .execute();
        
      expect(ascResult.data?.[0].name).toBe('A');
      expect(ascResult.data?.[1].name).toBe('B');
      expect(ascResult.data?.[2].name).toBe('C');
      
      // Order descending
      const descResult = await repo
        .select()
        .order('name', { ascending: false })
        .execute();
        
      expect(descResult.data?.[0].name).toBe('C');
      expect(descResult.data?.[1].name).toBe('B');
      expect(descResult.data?.[2].name).toBe('A');
    });
    
    test('pagination works', async () => {
      const data = [
        { id: '1', name: 'A', created_at: new Date().toISOString() },
        { id: '2', name: 'B', created_at: new Date().toISOString() },
        { id: '3', name: 'C', created_at: new Date().toISOString() },
        { id: '4', name: 'D', created_at: new Date().toISOString() },
        { id: '5', name: 'E', created_at: new Date().toISOString() }
      ];
      
      const repo = createMockRepository<TestEntity>('test_entities', data);
      
      // Test limit
      const limitResult = await repo
        .select()
        .limit(2)
        .execute();
        
      expect(limitResult.data).toHaveLength(2);
      expect(limitResult.data?.[0].id).toBe('1');
      expect(limitResult.data?.[1].id).toBe('2');
      
      // Test range
      const rangeResult = await repo
        .select()
        .range(1, 3)
        .execute();
        
      expect(rangeResult.data).toHaveLength(3);
      expect(rangeResult.data?.[0].id).toBe('2');
      expect(rangeResult.data?.[1].id).toBe('3');
      expect(rangeResult.data?.[2].id).toBe('4');
    });
  });
  
  describe('Repository Factory', () => {
    test('creates mock repository', () => {
      const repo = createRepository<TestEntity>('test_entities', 'mock');
      expect(repo.tableName).toBe('test_entities');
    });
    
    test('creates supabase repository by default', () => {
      const repo = createRepository<TestEntity>('test_entities');
      expect(repo.tableName).toBe('test_entities');
    });
  });
});
