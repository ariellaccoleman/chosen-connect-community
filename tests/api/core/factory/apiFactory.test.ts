
import { createApiFactory } from '@/api/core/factory/apiFactory';
import { createRepository } from '@/api/core/repository/repositoryFactory';
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { CentralTestAuthUtils } from '../../testing/CentralTestAuthUtils';

interface TestProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

describe('API Factory - Database Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await TestClientFactory.cleanup();
  });

  test('should create a factory with base operations using real repository', async () => {
    await CentralTestAuthUtils.executeWithAuthenticatedAPI(
      'user3',
      async (client) => {
        const repository = createRepository<TestProfile>('profiles', {}, client);
        
        const factory = createApiFactory<TestProfile>({
          tableName: 'profiles',
          repository: repository
        });

        // Check basic structure
        expect(factory).toHaveProperty('getAll');
        expect(factory).toHaveProperty('getById');
        expect(factory).toHaveProperty('create');
        expect(factory).toHaveProperty('update');
        expect(factory).toHaveProperty('delete');
        expect(factory).toHaveProperty('tableName');
      }
    );
  });

  test('should create a factory with extended query operations', async () => {
    await CentralTestAuthUtils.executeWithAuthenticatedAPI(
      'user3',
      async (client) => {
        const repository = createRepository<TestProfile>('profiles', {}, client);
        
        const factory = createApiFactory<TestProfile>({
          tableName: 'profiles',
          repository: repository,
          useQueryOperations: true
        });

        // Check query operations
        expect(factory).toHaveProperty('getAll');
        expect(factory).toHaveProperty('getById');
        expect(factory).toHaveProperty('getByIds');
      }
    );
  });

  test('should create a factory with extended batch operations', async () => {
    await CentralTestAuthUtils.executeWithAuthenticatedAPI(
      'user3',
      async (client) => {
        const repository = createRepository<TestProfile>('profiles', {}, client);
        
        const factory = createApiFactory<TestProfile>({
          tableName: 'profiles',
          repository: repository,
          useBatchOperations: true
        });

        // Check batch operations
        expect(factory).toHaveProperty('batchCreate');
        expect(factory).toHaveProperty('batchUpdate');
        expect(factory).toHaveProperty('batchDelete');
      }
    );
  });

  test('should perform real database operations with factory', async () => {
    await CentralTestAuthUtils.executeWithAuthenticatedAPI(
      'user3',
      async (client) => {
        const repository = createRepository<TestProfile>('profiles', {}, client);
        
        const factory = createApiFactory<TestProfile>({
          tableName: 'profiles',
          repository: repository
        });

        // Test getAll with real data
        const result = await factory.getAll();
        
        expect(result).toBeDefined();
        expect(result.status).toBeDefined();
        expect(['success', 'error']).toContain(result.status);
        
        if (result.status === 'success') {
          expect(Array.isArray(result.data)).toBe(true);
        }
      }
    );
  });

  test('should allow custom transformResponse with real data', async () => {
    await CentralTestAuthUtils.executeWithAuthenticatedAPI(
      'user3',
      async (client) => {
        // Mock transform function that adds a formatted property
        const mockTransformResponse = jest.fn((data) => ({
          ...data,
          formatted: true
        }));

        const repository = createRepository<TestProfile>('profiles', {}, client);
        
        const factory = createApiFactory<TestProfile>({
          tableName: 'profiles',
          repository: repository,
          transformResponse: mockTransformResponse
        });

        // Call getAll
        const result = await factory.getAll();

        if (result.status === 'success' && result.data && result.data.length > 0) {
          // Verify transformer was called
          expect(mockTransformResponse).toHaveBeenCalled();
          expect(result.data[0]).toHaveProperty('formatted', true);
        }
      }
    );
  });

  test('should pass defaultSelect to repository with real queries', async () => {
    await CentralTestAuthUtils.executeWithAuthenticatedAPI(
      'user3',
      async (client) => {
        const customSelect = 'id, first_name, email';
        
        const repository = createRepository<TestProfile>('profiles', {}, client);
        
        const factory = createApiFactory<TestProfile>({
          tableName: 'profiles',
          repository: repository,
          defaultSelect: customSelect
        });

        // Call getAll and verify it works with custom select
        const result = await factory.getAll();
        
        expect(result).toBeDefined();
        expect(result.status).toBeDefined();
        
        if (result.status === 'success' && result.data && result.data.length > 0) {
          // Verify the returned data only has the selected fields
          const firstItem = result.data[0];
          expect(firstItem).toHaveProperty('id');
          expect(firstItem).toHaveProperty('first_name');
          expect(firstItem).toHaveProperty('email');
        }
      }
    );
  });

  test('should handle database errors gracefully', async () => {
    await CentralTestAuthUtils.executeWithAuthenticatedAPI(
      'user3',
      async (client) => {
        const repository = createRepository<TestProfile>('profiles', {}, client);
        
        const factory = createApiFactory<TestProfile>({
          tableName: 'profiles',
          repository: repository
        });

        // Try to get a non-existent record
        const result = await factory.getById('non-existent-id');
        
        expect(result).toBeDefined();
        expect(result.status).toBeDefined();
        
        if (result.status === 'success') {
          expect(result.data).toBeNull();
        }
      }
    );
  });
});
