# Migration Guide: Using Schema-Based Testing

This guide outlines how to use the current schema-based testing approach in our application.

## Benefits of Schema-Based Testing

1. **Closer to Production**: Tests run against a real database with identical schema structure
2. **Better Test Coverage**: SQL constraints, triggers, and other database features are tested
3. **Simplified Maintenance**: No need to maintain separate mock implementations
4. **Easier Debugging**: Tests fail for the same reasons production would

## Current Testing Approach

### 1. Prepare the Test Environment

Set up your testing environment using the schema-based utilities:

```typescript
// In your Jest setup file or at the beginning of your test suite
import { setupTestSchema } from '@/api/core/testing/schemaBasedTesting';

beforeAll(async () => {
  await setupTestSchema();
});
```

### 2. Use Schema-Based Repositories

Create repositories that use the testing schema:

```typescript
// Current approach with schema-based testing
import { createTestingRepository } from '@/api/core/repository/repositoryFactory';
// OR
import { createTestingProfileRepository } from '@/api/core/repository/entities/factories/profileRepositoryFactory';

// Entity-specific repository (recommended)
const profileRepo = createTestingProfileRepository();
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

### 4. Current Assertions

Test directly against repository operations:

```typescript
// Current approach - verify the operation result directly
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

## Testing Strategy

1. **Schema-Based Approach**: All tests use real database operations against the testing schema
2. **Repository Creation**: Use `createTestingRepository` for isolated test repositories
3. **Test Setup/Teardown**: Use schema utilities for clean test environments
4. **Data Isolation**: Each test suite uses isolated testing schema data

## Common Patterns

### Database Connection Setup

Ensure tests can connect to the database:

```typescript
import { setupTestSchema } from '@/api/core/testing/schemaBasedTesting';

beforeAll(async () => {
  await setupTestSchema();
});
```

### Repository Testing

```typescript
import { createTestingRepository } from '@/api/core/repository';

const testRepo = createTestingRepository<User>('users');

test('should create user', async () => {
  const user = { name: 'Test User', email: 'test@example.com' };
  const result = await testRepo.insert(user).execute();
  expect(result.error).toBeNull();
  expect(result.data.name).toBe('Test User');
});
```

### Test Data Seeding

```typescript
import { seedTestData, clearTestTable } from '@/api/core/testing';

beforeEach(async () => {
  await seedTestData('users', mockUsers);
});

afterEach(async () => {
  await clearTestTable('users');
});
```

## Performance Considerations

Schema-based tests may run slower than mock tests. Optimize by:
- Running tests in parallel with `--maxWorkers`
- Minimizing database operations in setup/teardown
- Using transactions for faster rollbacks
- Leveraging test contexts for efficient setup

## Troubleshooting

### Database Connection Issues

If tests cannot connect to the database, check your Supabase connection configuration.

### Missing Tables or Columns

If tests fail due to missing tables or columns, ensure:
- Your schema has been properly set up with `setupTestSchema()`
- The testing schema has all required tables defined
- Column names match exactly between the test and actual schema

## Best Practices

1. **Use Testing Repositories**: Always use `createTestingRepository` for tests
2. **Isolate Test Data**: Use the testing schema for all test operations
3. **Clean Setup/Teardown**: Use the provided utilities for test lifecycle management
4. **Performance Awareness**: Monitor test performance and optimize where needed
5. **Real Database Benefits**: Leverage the fact that tests run against real database infrastructure

## Conclusion

Our current schema-based testing approach provides reliable, maintainable tests that closely mirror production behavior. By testing against a real database with schema isolation, we gain confidence in our repository implementations while maintaining test speed and reliability.
