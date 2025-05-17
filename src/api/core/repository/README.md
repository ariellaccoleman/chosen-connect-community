
# Repository Pattern in the Application

The repository pattern provides a standardized way to access data sources in the application. It abstracts the underlying data storage details and provides a consistent interface for data access.

## Key Components

### `DataRepository` Interface

The core interface that defines the standard operations available for data access:

```typescript
interface DataRepository<T> {
  select(): RepositoryQuery<T>;
  getById(id: string | number): Promise<T | null>;
  getAll(): Promise<T[]>;
  insert(data: Record<string, any>): Promise<T>;
  update(id: string | number, data: Record<string, any>): Promise<T>;
  delete(id: string | number): Promise<void>;
  // and more...
}
```

### Repository Types

- **SupabaseRepository**: Implementation for Supabase database access
- **MockRepository**: Implementation for testing and development without a database

## Usage Examples

### Creating a Repository

```typescript
// Create a repository for the 'users' table
const userRepository = createRepository<UserType>('users');

// With configuration options
const configuredRepo = createRepository<PostType>('posts', 'supabase', {
  defaultSelect: '*,author:users(*)',
  idField: 'post_id'
});
```

### Using a Repository

```typescript
// Basic operations
const users = await userRepository.getAll();
const user = await userRepository.getById('123');

// More complex queries
const activeUsers = await userRepository
  .select()
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(10)
  .execute();
```

## Best Practices

1. Use repositories as the primary data access method rather than direct API calls
2. Create separate repositories for different entity types
3. Abstract query complexity into repository methods
4. Use type parameters to ensure type safety
5. Handle errors consistently within repository implementations
