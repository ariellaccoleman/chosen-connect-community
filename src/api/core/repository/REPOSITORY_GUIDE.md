
# Repository Pattern Guide

This comprehensive guide covers the repository pattern implementation in our application, including usage examples, best practices, and testing strategies.

## Core Concepts

The repository pattern provides a standardized way to access data sources in the application. It abstracts the underlying data storage details and provides a consistent interface for data access.

### Key Components

- `DataRepository` Interface: Defines the standard operations available for data access
- `BaseRepository`: Abstract class implementing common repository functionality
- `SupabaseRepository`: Implementation for Supabase database access
- `MockRepository`: Implementation for testing without a database
- `EntityRepository`: Base class for entity-specific repositories
- `CachedRepository`: Decorator that adds caching capabilities to repositories

## Creating Repositories

### Basic Repository

```typescript
import { createRepository } from "@/api/core/repository";

// Simple repository for the 'organizations' table
const organizationsRepo = createRepository<Organization>("organizations");

// With table options
const profilesRepo = createRepository<Profile>("profiles", "supabase", {
  idField: "id",
  defaultSelect: "*, location:locations(*)"
});
```

### Enhanced Repository

Enhanced repositories provide additional features like response transformation, request validation, and standardized error handling.

```typescript
import { createEnhancedRepository } from "@/api/core/repository";

const profilesRepo = createEnhancedRepository<ProfileWithDetails>(
  "profiles",
  "supabase",
  undefined,
  {
    defaultSelect: "*, location:locations(*)",
    transformResponse: formatProfileWithDetails,
    enableLogging: true
  }
);
```

### Entity-Specific Repositories

```typescript
import { createProfileRepository } from "@/api/core/repository/entities/factories";

// Create a profile repository with specialized profile methods
const profileRepo = createProfileRepository();
```

## Repository Operations

### Standard Operations

```typescript
import { createStandardOperations } from "@/api/core/repository";

const profilesRepo = createRepository<Profile>("profiles");
const profileOperations = createStandardOperations(profilesRepo, "Profile");

// Standard CRUD operations with error handling
const getProfile = await profileOperations.getById(profileId);
const updateProfile = await profileOperations.update(profileId, { bio: "New bio" });
```

### Query Operations

```typescript
// Filtering
const activeUsers = await repository
  .select()
  .eq("status", "active")
  .not("role", "eq", "admin")
  .execute();

// Pagination
const paginatedUsers = await repository
  .select()
  .order("created_at", { ascending: false })
  .range(0, 9)
  .execute();

// Relationships
const userWithPosts = await repository
  .select("*, posts:user_posts(*)")
  .eq("id", userId)
  .maybeSingle()
  .execute();
```

## API Factory Integration

Repositories power the API factories in the application:

```typescript
import { createApiFactory } from "@/api/core/factory";

const profileApi = createApiFactory<Profile, string, CreateProfileDto, UpdateProfileDto>({
  tableName: "profiles",
  entityName: "Profile",
  repository: {
    type: "supabase",
    enhanced: true,
    enableLogging: true
  },
  useQueryOperations: true,
  useMutationOperations: true
});
```

## Testing Repositories

Our testing utilities help you test repositories efficiently:

### Creating Test Repositories

```typescript
import { createTestRepository } from "@/api/core/testing/repositoryTestUtils";

// Create a test repository with mock data
const testRepo = createTestRepository<User>({
  tableName: 'users',
  initialData: mockUsers,
  entityType: 'profile'  // For automatic mock data generation
});

// Use the enhanced testing methods
testRepo.findById('123');
testRepo.addItems(newUser);
testRepo.mockError('select', 'DATABASE_ERROR', 'Failed to query database');
```

### Creating Test Contexts

```typescript
import { createRepositoryTestContext } from "@/api/core/testing/repositoryTestUtils";

// Create a reusable test context
const context = createRepositoryTestContext<User>({
  tableName: 'users',
  entityType: 'profile'
});

// In your tests
beforeEach(() => context.setup());
afterEach(() => context.cleanup());

test('should get user by ID', async () => {
  // Use the repository from the context
  const user = await context.repository.getById('123');
  expect(user).toEqual(expect.objectContaining({ id: '123' }));
});
```

### Mocking Repository Factory

```typescript
import { mockRepositoryFactory } from "@/api/core/testing/repositoryTestUtils";

// Mock all repositories 
mockRepositoryFactory({
  users: mockUsers,
  organizations: mockOrganizations
});

// After tests
resetRepositoryFactoryMock();
```

### Testing Relationships

```typescript
import { createRelationshipTestContext } from "@/api/core/testing/relationshipTesting";

// Create a context for testing relationships
const relationshipContext = createRelationshipTestContext<Post, User>({
  sourceTableName: 'posts',
  targetTableName: 'users',
  foreignKeyField: 'author_id',
  sourceEntityType: 'post',
  targetEntityType: 'profile'
});

// Test valid relationships
const { source: post, target: author } = await relationshipContext.generateRelatedEntity();
const isValid = await relationshipContext.tester.testEntityRelationships(post);
expect(isValid).toBe(true);
```

### Snapshot Testing

```typescript
import { createResponseSnapshot } from "@/api/core/testing/snapshotTesting";

// Create a snapshot of a repository response
const snapshot = createResponseSnapshot(response, {
  excludeFields: ['created_at', 'updated_at'],
  includeErrors: true
});

// Compare snapshots
const comparison = compareSnapshots(snapshot, expectedSnapshot);
expect(comparison.equal).toBe(true);
```

### Performance Testing

```typescript
import { RepositoryPerformanceTester } from "@/api/core/testing/validationUtils";

// Create a performance tester
const performanceTester = new RepositoryPerformanceTester(repository);

// Measure operation performance
const { result, duration } = await performanceTester.measure('getUsers', async () => {
  return repository.getAll();
});

// Generate a report
const report = performanceTester.generateReport();
console.log(`Average query duration: ${report.select.avgDuration}ms`);
```

## Advanced Features

### Caching

```typescript
import { CachedRepository } from "@/api/core/repository/cache";

// Create a cached repository
const cachedRepo = new CachedRepository(repository, {
  strategy: 'cache-first',
  ttl: 300,  // 5 minutes
  storage: 'persistent'
});

// Use it like a normal repository
const data = await cachedRepo.getById('123');
```

### Repository Validation

```typescript
import { RepositoryValidator } from "@/api/core/testing/validationUtils";

// Create a validator
const validator = new RepositoryValidator(userRepo)
  .addValidator('email', RepositoryValidator.uniqueValidator('email'))
  .addValidator('name', RepositoryValidator.notEmptyValidator('name'));

// Validate an entity
try {
  await validator.validate(user);
} catch (error) {
  // Handle validation errors
}
```

## Best Practices

1. **Use Typed Repositories**: Always specify the type parameter when creating repositories.
2. **Centralize Repository Creation**: Create repositories in a central location to avoid duplication.
3. **Use Standard Operations**: For common CRUD operations, use the standard operations helpers.
4. **Handle Errors Consistently**: Either use standard operations or follow the error handling patterns.
5. **Repository Naming**: Follow the convention of using the plural form of the entity for repositories.
6. **Type Safety**: Ensure your repository operations are properly typed to catch errors at compile time.
7. **Testing**: Use the testing utilities to thoroughly test repository operations.
8. **Mock Data Generation**: Use the mock data generators for consistent test data.
