
# Repository Utilities

This document outlines the utility functions available for working with repositories in the application.

## Repository Factory

The `createRepository` function creates a repository instance for a specific table:

```typescript
function createRepository<T>(
  tableName: string,
  type: RepositoryType = 'supabase',
  initialData?: T[]
): DataRepository<T>
```

### Parameters

- `tableName`: The name of the database table
- `type`: Repository implementation to use ('supabase' or 'mock')
- `initialData`: Initial data for mock repositories

### Returns

An instance of `DataRepository<T>` configured for the specified table.

## Query Builders

The repository pattern includes query builder methods that help construct type-safe database queries:

```typescript
// Basic query with conditions
const result = await repository
  .select()
  .eq('status', 'active')
  .neq('deleted_at', null)
  .execute();

// Pagination
const paginatedResult = await repository
  .select()
  .order('created_at', { ascending: false })
  .range(0, 9)
  .execute();

// Relationships
const withRelations = await repository
  .select('*, profile:profiles(*)')
  .eq('id', userId)
  .maybeSingle()
  .execute();
```

## Error Handling

Repository operations wrap database errors into a consistent format:

```typescript
try {
  await repository.insert(data);
} catch (error) {
  // Error is normalized to include:
  // - code: string (e.g., 'FOREIGN_KEY_VIOLATION')
  // - message: string
  // - details: any (implementation-specific details)
}
```

## Batch Operations

For operations involving multiple records:

```typescript
// Batch insert
const newRecords = await repository.batchInsert([record1, record2]);

// Batch update
await repository.batchUpdate([
  { id: '1', data: { status: 'active' } },
  { id: '2', data: { status: 'inactive' } }
]);
```
