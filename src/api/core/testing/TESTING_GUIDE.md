
# Repository Testing Utilities Guide

This guide covers the testing utilities available for working with repositories in the application.

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

## Repository Testing

### Creating Test Repositories

The `createTestRepository` function creates enhanced repositories for testing:

```typescript
import { createTestRepository } from '@/api/core/testing/repositoryTestUtils';

// Create a test repository
const testRepo = createTestRepository<User>({
  tableName: 'users',
  initialData: mockUsers,
  entityType: 'profile'  // For automatic data generation
});

// Access test utilities
testRepo.findById('123');
testRepo.addItems(newUser);
testRepo.updateItem('123', { name: 'Updated Name' });
testRepo.clearItems();
testRepo.mockError('select', 'NOT_FOUND', 'User not found');
testRepo.mockSuccess('getById', { id: '123', name: 'Test User' });

// Monitor method calls with spies
expect(testRepo.spies.select).toHaveBeenCalledTimes(1);
testRepo.resetSpies();
```

### Testing Repository Contexts

The `createRepositoryTestContext` function creates a reusable test context:

```typescript
import { createRepositoryTestContext } from '@/api/core/testing/repositoryTestUtils';

// Create a test context
const context = createRepositoryTestContext<User>({
  tableName: 'users',
  entityType: 'profile',
  initialData: mockUsers
});

// Setup in test
beforeEach(() => context.setup());
afterEach(() => context.cleanup());

test('should get user by ID', async () => {
  const { repository } = context;
  const user = await repository.getById('123');
  expect(user).toBeDefined();
});

// Generate test data directly from context
const testUsers = context.generateData(5, { role: 'user' });
```

### Mocking Repository Factory

```typescript
import { mockRepositoryFactory, resetRepositoryFactoryMock } from '@/api/core/testing/repositoryTestUtils';

// Setup mocks before tests
beforeAll(() => {
  mockRepositoryFactory({
    users: mockUsers,
    organizations: mockOrganizations,
    events: mockEvents
  });
});

// Your tests here...

// Reset after tests
afterAll(() => {
  resetRepositoryFactoryMock();
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
import { createTestRepository } from '@/api/core/testing/repositoryTestUtils';

describe('User Repository', () => {
  const repo = createTestRepository<User>({
    tableName: 'users',
    entityType: 'profile'
  });
  
  beforeEach(() => {
    repo.clearItems();
    repo.resetSpies();
  });
  
  test('should create a new user', async () => {
    const newUser = { id: '123', name: 'Test User' };
    await repo.insert(newUser);
    
    const result = await repo.getById('123');
    expect(result).toEqual(newUser);
    expect(repo.spies.insert).toHaveBeenCalledTimes(1);
  });
});
```
