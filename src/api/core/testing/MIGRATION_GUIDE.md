# Migration Guide: Moving from Mock Repositories to Schema-Based Testing

This guide outlines the process of migrating existing tests from using mock repositories to the new schema-based testing approach.

## Benefits of Schema-Based Testing

1. **Closer to Production**: Tests run against a real database with identical schema structure
2. **Better Test Coverage**: SQL constraints, triggers, and other database features are tested
3. **Simplified Maintenance**: No need to maintain separate mock implementations
4. **Easier Debugging**: Tests fail for the same reasons production would

## Migration Steps

### 1. Prepare the Test Environment

Before migrating any tests, ensure your testing environment is set up correctly:

```typescript
// In your Jest setup file or at the beginning of your test suite
import { setupTestSchema } from '@/api/core/testing/schemaBasedTesting';

beforeAll(async () => {
  await setupTestSchema();
});
```

### 2. Replace Mock Repositories with Schema-Based Repositories

Replace code like this:

```typescript
// Old approach with mock repositories
import { createMockRepository } from '@/api/core/repository/MockRepository';

const mockRepo = createMockRepository<Profile>('profiles', initialData);
```

With this:

```typescript
// New approach with schema-based testing
import { createTestingProfileRepository } from '@/api/core/repository/entities/factories/profileRepositoryFactory';
// OR
import { createTestingRepository } from '@/api/core/repository/repositoryFactory';

// Entity-specific repository (recommended)
const profileRepo = createTestingProfileRepository(initialData);
// OR
// Generic repository
const profileRepo = createTestingRepository<Profile>('profiles');
```

### 3. Use Test Context for Better Test Isolation

For better test isolation and utilities, use the `createTestContext` helper:

```typescript
import { createTestContext } from '@/api/core/testing/schemaBasedTesting';

describe('Profile Tests', () => {
  const profileContext = createTestContext<Profile>('profiles');
  
  beforeEach(async () => {
    // Setup with initial data
    await profileContext.setup(initialProfiles);
  });
  
  afterEach(async () => {
    // Clean up after each test
    await profileContext.cleanup();
  });
  
  test('should create profile', async () => {
    // Use the repository from the context
    const result = await profileContext.repository.insert(newProfile).execute();
    // Rest of the test...
  });
});
```

### 4. Update Assertions

Most assertions can remain the same, but some mock-specific assertions may need updates:

```typescript
// Old approach
expect(mockRepo.spies.insert).toHaveBeenCalledWith(expectedData);

// New approach - verify the operation result directly
const result = await repo.insert(newData).execute();
expect(result.error).toBeNull();
expect(result.data).toBeTruthy();
```

### 5. Test Data Management

Use the provided utilities for managing test data:

```typescript
import { seedTestData, clearTestTable } from '@/api/core/testing/schemaBasedTesting';

// Seed test data
await seedTestData<Profile>('profiles', testProfiles);

// Clear test data
await clearTestTable('profiles');
```

## Migration Strategy

1. **Incremental Approach**: Migrate one test suite at a time
2. **Start Simple**: Begin with simpler repositories that have fewer dependencies
3. **Update Entity Factories**: Ensure all entity repositories have `createTesting*Repository` functions
4. **Run in Parallel**: During migration, you can run both mock and schema-based tests together
5. **Remove Mock Code**: After all tests are migrated, remove mock implementations

## Common Issues and Solutions

### Database Connection Issues

If tests cannot connect to the database, check your Supabase connection configuration.

### Slow Tests

Schema-based tests may run slower than mock tests. Optimize by:
- Running tests in parallel with `--maxWorkers`
- Minimizing database operations in setup/teardown
- Using transactions for faster rollbacks

### Missing Tables or Columns

If tests fail due to missing tables or columns, ensure:
- Your schema has been properly set up with `setupTestSchema()`
- The public schema has all required tables defined
- Column names match exactly between the test and actual schema

## Conclusion

This migration improves the reliability and value of our test suite by testing against a real database. Take your time during migration, and reach out for help if you encounter issues.
