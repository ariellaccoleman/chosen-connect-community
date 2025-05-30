
# Repository Testing Utilities Guide

This guide covers the testing utilities available for working with repositories using schema-based testing in the application.

## Mock Data Generation

The `MockDataGenerator` class allows you to generate realistic test data for different entity types:

```typescript
import { createMockDataGenerator } from '@/api/core/testing/mockDataGenerator';

// Create a generator for a specific entity type
const userGenerator = createMockDataGenerator<User>('profile');

// Generate a single entity
const mockUser = userGenerator.generate();

// Generate multiple entities
const mockUsers = userGenerator.generateMany(5);

// Generate with specific field values
const admin = userGenerator.generate({ 
  role: 'admin',
  isVerified: true
});

// Custom field generators
const customGenerator = createMockDataGenerator<User>('profile', {
  email: () => 'test@example.com',
  createdAt: () => new Date(2023, 0, 1).toISOString()
});
```

### Entity Types with Default Generators

The following entity types have built-in generation templates:

- `profile` - User profiles with names, emails, bios, etc.
- `organization` - Organizations with names, descriptions, websites, etc.
- `event` - Events with titles, descriptions, dates, etc.
- `tag` - Tags with names and descriptions

### Creating Related Entities

```typescript
// Generate entities with relationships
const userWithPosts = userGenerator
  .withRelations({
    name: 'posts',
    type: 'post',
    count: 3
  })
  .generate();

// Access the related entities
console.log(userWithPosts.posts); // Array of 3 post entities
```

## Schema-Based Repository Testing

### Creating Test Repositories

Use `createTestingRepository` to create repositories for testing:

```typescript
import { createTestingRepository, setupTestSchema } from '@/api/core/repository';

// Setup test environment
beforeAll(async () => {
  await setupTestSchema();
});

// Create a test repository using the testing schema
const testRepo = createTestingRepository<User>('users');

// Use standard repository operations
const user = await testRepo.getById('123');
const newUser = await testRepo.insert({ name: 'Test User' }).execute();
```

### Testing Repository Contexts

The `createTestContext` function creates a reusable test context:

```typescript
import { createTestContext } from '@/api/core/testing/schemaBasedTesting';

// Create a test context
const context = createTestContext<User>('users');

// Setup in test
beforeEach(async () => {
  await context.setup();
});

afterEach(async () => {
  await context.cleanup();
});

test('should get user by ID', async () => {
  const { repository } = context;
  const user = await repository.getById('123');
  expect(user).toBeDefined();
});

// Generate test data directly from context
const testUsers = context.generateData(5, { role: 'user' });
```

### Test Data Management

```typescript
import { seedTestData, clearTestTable } from '@/api/core/testing/schemaBasedTesting';

// Seed test data before tests
beforeEach(async () => {
  await seedTestData('users', mockUsers);
});

// Clear test data after tests
afterEach(async () => {
  await clearTestTable('users');
});
```

## Snapshot Testing

The snapshot testing utilities help compare repository responses:

```typescript
import { createResponseSnapshot, compareSnapshots } from '@/api/core/testing/snapshotTesting';

// Create a snapshot of a repository response
const snapshot = createResponseSnapshot(response, {
  excludeFields: ['created_at', 'updated_at'],
  includeErrors: true,
  transformers: {
    email: (email) => email ? 'EMAIL_PRESENT' : 'EMAIL_MISSING'
  }
});

// Compare with expected snapshot
const expectedSnapshot = {
  status: 'success',
  data: { id: '123', name: 'Test User' }
};

const comparison = compareSnapshots(snapshot, expectedSnapshot);
expect(comparison.equal).toBe(true);

// If not equal, check differences
if (!comparison.equal) {
  console.log(comparison.differences);
}
```

## Relationship Testing

Test relationships between entities:

```typescript
import { createRelationshipTestContext, RelationshipTester } from '@/api/core/testing/relationshipTesting';

// Create a context for testing relationships
const relationshipContext = createRelationshipTestContext<Post, User>({
  sourceTableName: 'posts',
  targetTableName: 'users',
  foreignKeyField: 'author_id',
  sourceEntityType: 'post',
  targetEntityType: 'profile',
  optional: false
});

// Generate entities with valid relationships
const { source: post, target: author } = await relationshipContext.generateRelatedEntity();

// Test if relationships are valid
const isValid = await relationshipContext.tester.testEntityRelationships(post);
expect(isValid).toBe(true);

// Generate invalid relationship for negative testing
const invalidPost = await relationshipContext.generateInvalidRelationship();
const isInvalidRelationshipValid = await relationshipContext.tester.testEntityRelationships(invalidPost);
expect(isInvalidRelationshipValid).toBe(false);

// Cleanup test data
relationshipContext.cleanup();
```

## Validation Testing

Test validation rules for repositories:

```typescript
import { RepositoryValidator } from '@/api/core/testing/validationUtils';

// Create a validator for a repository
const validator = new RepositoryValidator(userRepo)
  .addValidator('email', RepositoryValidator.uniqueValidator('email'))
  .addValidator('name', RepositoryValidator.notEmptyValidator('name'))
  .addValidator('organizationId', RepositoryValidator.relationshipValidator(
    'organizationId', organizationRepo
  ));

// Validate an entity
try {
  await validator.validate(user);
  console.log('Validation passed');
} catch (error) {
  if (error instanceof RepositoryValidationError) {
    console.log(`Validation failed for field: ${error.field}`);
  }
}
```

## Performance Testing

Measure and analyze repository operation performance:

```typescript
import { RepositoryPerformanceTester } from '@/api/core/testing/validationUtils';

// Create a performance tester
const performanceTester = new RepositoryPerformanceTester(repository);

// Measure operation performance
const { result, duration } = await performanceTester.measure('getUsers', async () => {
  return repository.getAll();
});
console.log(`Operation took ${duration}ms`);

// Measure multiple operations
await performanceTester.measure('getById', async () => repository.getById('123'));
await performanceTester.measure('query', async () => repository.select().eq('role', 'admin').execute());

// Generate a performance report
const report = performanceTester.generateReport();
console.log(report);
/*
{
  getUsers: { count: 1, avgDuration: 15.2, minDuration: 15.2, maxDuration: 15.2 },
  getById: { count: 1, avgDuration: 5.7, minDuration: 5.7, maxDuration: 5.7 },
  query: { count: 1, avgDuration: 12.1, minDuration: 12.1, maxDuration: 12.1 }
}
*/

// Clear measurements
performanceTester.clearMeasurements();
```

## Integration with Jest

The testing utilities are designed to work with Jest:

```typescript
import { createTestingRepository, setupTestSchema } from '@/api/core/repository';

describe('User Repository', () => {
  beforeAll(async () => {
    await setupTestSchema();
  });
  
  const repo = createTestingRepository<User>('users');
  
  beforeEach(async () => {
    await clearTestTable('users');
  });
  
  test('should create a new user', async () => {
    const newUser = { id: '123', name: 'Test User' };
    const result = await repo.insert(newUser).execute();
    
    expect(result.error).toBeNull();
    expect(result.data.name).toBe('Test User');
  });
});
```

## Best Practices

1. **Use Schema-Based Testing**: Always use testing repositories for isolation
2. **Clean Test Environment**: Use setup/teardown utilities for clean tests
3. **Generate Realistic Data**: Use mock data generators for consistent test data
4. **Test Relationships**: Validate entity relationships thoroughly
5. **Performance Monitoring**: Use performance testing to catch regressions
6. **Snapshot Testing**: Use snapshots for complex response validation
7. **Proper Cleanup**: Always clean up test data after tests

## Migration Notes

Our testing approach has been fully migrated to schema-based testing. This means:
- All tests use real database operations against the testing schema
- No mock repositories are used in the current implementation
- Test isolation is achieved through schema separation rather than in-memory mocks
- Tests provide better coverage and confidence due to real database interactions
