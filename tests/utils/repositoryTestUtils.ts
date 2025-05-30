
import { createTestingRepository } from '@/api/core/repository/repositoryFactory';
import { BaseRepository } from '@/api/core/repository/BaseRepository';

/**
 * Creates a consistent schema-based repository for testing
 * 
 * @param tableName Name of the table
 * @param initialData Initial data to populate the repository
 * @param client Optional client to use for the repository
 * @returns A schema-based repository instance for testing
 */
export function createTestRepository<T>(
  tableName: string, 
  initialData: T[] = [],
  client?: any
): BaseRepository<T> {
  console.log(`[createTestRepository] Creating schema-based repository for ${tableName} with ${initialData.length} items`);
  
  // Create the schema-based testing repository
  const repo = createTestingRepository<T>(tableName, {
    schema: 'testing',
    enableLogging: true,
    client
  }, client);
  
  // If initial data is provided, we'll seed it during test setup
  if (initialData.length > 0) {
    console.log(`[createTestRepository] Initial data will be seeded during test setup`);
  }
  
  console.log(`[createTestRepository] Schema-based repository created for ${tableName}`);
  
  return repo;
}

/**
 * Seed initial data into a repository
 * 
 * @param repository The repository to seed
 * @param data The data to seed
 */
export async function seedRepository<T>(
  repository: BaseRepository<T>,
  data: T[]
): Promise<void> {
  if (data.length === 0) return;
  
  console.log(`[seedRepository] Seeding ${data.length} items`);
  
  const result = await repository.insert(data).execute();
  
  if (result.isError()) {
    throw new Error(`Failed to seed repository: ${result.getErrorMessage()}`);
  }
  
  console.log(`[seedRepository] Successfully seeded ${data.length} items`);
}

/**
 * Clear all data from a repository
 * 
 * @param repository The repository to clear
 */
export async function clearRepository<T>(
  repository: BaseRepository<T>
): Promise<void> {
  console.log(`[clearRepository] Clearing repository data`);
  
  const result = await repository.delete().execute();
  
  if (result.isError()) {
    throw new Error(`Failed to clear repository: ${result.getErrorMessage()}`);
  }
  
  console.log(`[clearRepository] Repository cleared successfully`);
}

/**
 * @deprecated Use schema-based testing instead of mock repositories
 */
export function mockRepositoryFactory(mockData: Record<string, any[]> = {}) {
  console.warn('mockRepositoryFactory is deprecated. Use schema-based testing with createTestRepository instead.');
  throw new Error('Mock repositories are no longer supported. Use schema-based testing.');
}

/**
 * @deprecated Use schema-based testing instead of mock repositories
 */
export function resetRepositoryFactoryMock() {
  console.warn('resetRepositoryFactoryMock is deprecated. Use schema-based testing instead.');
}
