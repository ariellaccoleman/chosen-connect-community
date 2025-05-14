
# API and Query Hook Factories

This document explains how to use the factory patterns to create consistent API operations and React Query hooks.

## Basic Usage

### 1. Create API Operations

First, use `createApiOperations` to create standardized CRUD operations for an entity:

```typescript
// src/api/users/usersApi.ts
import { createApiOperations } from '../core/apiFactory';
import { User } from '@/types';

// Create base operations
export const usersApi = createApiOperations<User>(
  'user',    // Entity name (for logs and errors)
  'users'    // Table name in database
);
```

### 2. Create Query Hooks

Then, use `createQueryHooks` to create standardized React Query hooks:

```typescript
// src/hooks/useUsers.ts
import { createQueryHooks } from './core/queryHookFactory';
import { usersApi } from '@/api/users/usersApi';
import { User } from '@/types';

// Create hooks and export them with friendly names
export const {
  useList: useUsers,
  useById: useUser,
  useCreate: useCreateUser,
  useUpdate: useUpdateUser,
  useDelete: useDeleteUser
} = createQueryHooks<User>(
  { name: 'user', pluralName: 'users' },
  usersApi
);
```

### 3. Use the Hooks in Components

Now you can use the hooks in your components:

```typescript
// src/components/UsersList.tsx
import { useUsers, useCreateUser } from '@/hooks/useUsers';

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

### Extended API Operations

For custom API operations, use `extendApiOperations`:

```typescript
// src/api/users/usersApi.ts
import { createApiOperations } from '../core/apiFactory';
import { extendApiOperations } from '../core/apiExtension';
import { User } from '@/types';

// Create base operations
const baseOperations = createApiOperations<User>('user', 'users');

// Extend with custom operations
export const usersApi = extendApiOperations(baseOperations, {
  getUsersByDepartment: async (departmentId: string) => {
    // Custom implementation
    // ...
  },
  
  resetPassword: async (userId: string) => {
    // Custom implementation
    // ...
  }
});
```

### Custom Query Hooks

Add custom query hooks based on your extended API:

```typescript
// src/hooks/useUsers.ts
import { useQuery } from '@tanstack/react-query';
import { createQueryHooks } from './core/queryHookFactory';
import { usersApi } from '@/api/users/usersApi';

// Create base hooks
export const {
  // ... standard hooks
} = createQueryHooks({ name: 'user' }, usersApi);

// Add custom hooks
export const useUsersByDepartment = (departmentId: string) => {
  return useQuery({
    queryKey: ['users', 'department', departmentId],
    queryFn: () => usersApi.getUsersByDepartment(departmentId),
    enabled: !!departmentId
  });
};
```
