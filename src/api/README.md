
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

// Avoid (legacy pattern)
import { organizationsApi } from '@/api';
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

## Migration Plan

All files that re-export functionality from other modules (for backward compatibility) will be removed in future versions. Please update your imports to use the modular structure directly.

### Timeline

- **Current version**: Deprecated modules are marked with JSDoc @deprecated tags
- **Next major version**: Console warnings will be added for deprecated imports
- **Following major version**: Deprecated modules will be removed completely
