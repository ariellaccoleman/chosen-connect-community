
# Repository Pattern Usage Guide

This guide describes how to use the repository pattern in the application to access and manipulate data.

## Introduction

The repository pattern is an abstraction layer between your application and the data source. It provides a clean API to work with data and abstracts the underlying infrastructure details, making the codebase more maintainable and testable.

## Getting Started

### Creating a Repository

There are multiple ways to create repositories in the application:

#### Basic Repository

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

#### Enhanced Repository

Enhanced repositories provide additional features like response transformation, request validation, and standardized error handling.

```typescript
import { createEnhancedRepository } from "@/api/core/repository";
import { formatProfileWithDetails } from "@/utils/formatters";

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

### Standard Operations

Use standard operations to reduce repetitive code and ensure consistent error handling:

```typescript
import { createStandardOperations } from "@/api/core/repository";

const profilesRepo = createRepository<Profile>("profiles");
const profileOperations = createStandardOperations(profilesRepo, "Profile");

// Standard CRUD operations with error handling
const getProfile = await profileOperations.getById(profileId);
const updateProfile = await profileOperations.update(profileId, { bio: "New bio" });
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

## Testing with Mock Repositories

For testing, use mock repositories to avoid database dependencies:

```typescript
import { createRepository } from "@/api/core/repository";
import { mockProfiles } from "@/tests/fixtures";

// Create a mock repository with initial data
const mockProfilesRepo = createRepository<Profile>(
  "profiles", 
  "mock", 
  mockProfiles
);

// Test repository operations without hitting the database
const profile = await mockProfilesRepo.getById("123");
```

## Repository Query API

The repository query API provides a fluent interface for creating complex queries:

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

// Count
const { count } = await repository
  .select("id", { count: true })
  .eq("status", "active")
  .execute();
```

## Best Practices

1. **Use Typed Repositories**: Always specify the type parameter when creating repositories.

2. **Centralize Repository Creation**: Create repositories in a central location to avoid duplication.

3. **Use Standard Operations**: For common CRUD operations, use the standard operations helpers.

4. **Handle Errors Consistently**: Either use standard operations or follow the error handling patterns.

5. **Repository Naming**: Follow the convention of using the plural form of the entity for repositories.

6. **Type Safety**: Ensure your repository operations are properly typed to catch errors at compile time.

## Migration from Direct API Calls

If you're migrating from direct API calls to repositories, follow these steps:

1. Identify the data access code and the table it's working with.
2. Create a repository for that table.
3. Replace direct API calls with repository operations.
4. Use standard operations for common CRUD functionality.
5. Add specific methods for specialized data access needs.
