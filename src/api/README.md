
# API Module Structure

This directory contains the API module structure for the application. The API layer is responsible for communicating with backend services and providing data to the application.

## Directory Structure

```
api/
├── core/                  # Core API functionality
│   ├── apiClient.ts       # Base API client for making requests
│   ├── errorHandler.ts    # Error handling utilities
│   ├── factory/           # API factory pattern implementation
│   ├── repository/        # Repository pattern implementation
│   │   ├── cache/         # Repository caching implementation
│   │   ├── entities/      # Entity-specific repositories
│   │   └── operations/    # Repository operations
│   ├── testing/           # Repository testing utilities
│   └── types.ts           # Common type definitions
├── auth/                  # Authentication related API
├── events/                # Events API
├── locations/             # Locations API
├── organizations/         # Organizations API
├── profiles/              # Profiles API
├── tags/                  # Tags API
└── tests/                 # Test reporting API
```

## Usage Guidelines

### Preferred Import Patterns

Always import from the specific module directly:

```typescript
// Preferred
import { profileApi } from '@/api/profiles';
import { organizationApi } from '@/api/organizations';
import { createTestingRepository } from '@/api/core/repository';
```

### Factory Pattern

The API modules use a factory pattern to create standardized API operations:

```typescript
// Creating API operations for a new entity type
const newEntityApi = createApiFactory<EntityType>({
  tableName: 'entity_table',
  entityName: 'entity',
  useQueryOperations: true,
  useMutationOperations: true
});
```

### Repository Pattern

The repository pattern is used to abstract database access:

```typescript
// Creating a repository for a table
const repository = createRepository<EntityType>('entity_table');

// Using the repository
const { data, error } = await repository
  .select()
  .eq('id', entityId)
  .execute();
```

### Testing Utilities

The repository testing utilities provide robust tools for schema-based testing:

```typescript
// Create a testing repository with schema isolation
const testRepo = createTestingRepository<User>('users', {
  schema: 'testing'
});

// Setup test schema before tests
await setupTestSchema();

// Generate test data
const mockData = createMockDataGenerator<User>('profile')
  .generateMany(5);
```

For complete documentation on testing repositories, see [Repository Guide](./core/repository/REPOSITORY_GUIDE.md).
