# API and Query Hook Factories

This document explains how to use the factory patterns to create consistent API operations and React Query hooks.

## Basic Usage

### 1. Create API Operations

First, use `createApiFactory` to create standardized CRUD operations for an entity:

```typescript
// src/api/users/usersApi.ts
import { createApiFactory } from '@/api/core/factory';
import { User } from '@/types';

// Create API operations with the factory
export const usersApi = createApiFactory<User>({
  tableName: 'users',    // Table name in database
  entityName: 'User',    // Entity name (for logs and errors)
  useQueryOperations: true,
  useMutationOperations: true
});

// Extract specific operations for direct usage
export const {
  getAll: getAllUsers,
  getById: getUserById,
  create: createUser,
  update: updateUser,
  delete: deleteUser
} = usersApi;
```

### 2. Create Query Hooks

Then, use `createQueryHooks` to create standardized React Query hooks:

```typescript
// src/hooks/users/useUserHooks.ts
import { createQueryHooks } from '@/hooks/core/factory';
import { usersApi } from '@/api/users/usersApi';
import { User } from '@/types';

// Create hooks with the factory
export const userHooks = createQueryHooks<User>(
  { name: 'user', pluralName: 'users' },
  usersApi
);

// Extract and export with friendly names
export const {
  useList: useUsers,
  useById: useUser,
  useCreate: useCreateUser,
  useUpdate: useUpdateUser,
  useDelete: useDeleteUser
} = userHooks;
```

### 3. Use the Hooks in Components

Now you can use the hooks in your components:

```typescript
// src/components/UsersList.tsx
import { useUsers, useCreateUser } from '@/hooks/users';

const UsersList = () => {
  const { data: usersResponse, isLoading } = useUsers();
  const { mutate: createUser } = useCreateUser();
  
  // The users data with proper error handling
  const users = usersResponse?.data || [];
  
  const handleAddUser = () => {
    createUser({ name: 'New User', email: 'user@example.com' });
  };
  
  // ...render component
};
```

## Advanced Usage

### Data Transformation

Use transform functions to map between API data and domain types:

```typescript
export const usersApi = createApiFactory<User>({
  tableName: 'users',
  entityName: 'User',
  // Transform database responses to domain types
  transformResponse: (data) => ({
    id: data.id,
    name: data.name,
    email: data.email,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }),
  // Transform domain types to database fields
  transformRequest: (data) => ({
    name: data.name,
    email: data.email,
    ...(data.updatedAt ? { updated_at: data.updatedAt } : {})
  })
});
```

### Repository Configuration

Use the repository option to control data access:

```typescript
// Use mock repository for testing
export const testUsersApi = createApiFactory<User>({
  tableName: 'users',
  repository: { type: 'mock', initialData: testUsers }
});

// Use an explicit repository instance
import { createSupabaseRepository } from '@/api/core/repository';
const userRepo = createSupabaseRepository<User>('users');

export const usersApi = createApiFactory<User>({
  tableName: 'users',
  repository: userRepo
});
```

### Custom Select Fields

Define default fields to select:

```typescript
export const usersApi = createApiFactory<User>({
  tableName: 'users',
  defaultSelect: 'id, name, email, profile:profiles(*)', 
  // ...other options
});
```

### Batch Operations

Enable batch operations for working with multiple entities:

```typescript
export const usersApi = createApiFactory<User>({
  tableName: 'users',
  useBatchOperations: true
  // ...other options
});

// Use batch operations
await usersApi.batchCreate([newUser1, newUser2]);
await usersApi.batchUpdate([{ id: '1', name: 'Updated' }, { id: '2', role: 'admin' }]);
await usersApi.batchDelete(['1', '2', '3']);
```

## Best Practices

1. **Consistent Naming**: Use singular names for entities (`user` not `users`)
2. **Extract Operations**: Extract specific operations for direct imports
3. **Create Domain Types**: Define clear types for your domain entities
4. **Use Transforms**: Handle data mapping through transform functions
5. **Centralize Configuration**: Keep API config in a single module per entity
