
# System Architecture

This document explains the layered architecture of the application, covering all layers from the database to the UI components.

## Architecture Overview

The application follows a layered architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    UI COMPONENTS LAYER                      │
├─────────────────────────────────────────────────────────────┤
│                     REACT HOOKS LAYER                      │
├─────────────────────────────────────────────────────────────┤
│                    API OPERATIONS LAYER                    │
├─────────────────────────────────────────────────────────────┤
│                    REPOSITORY LAYER                        │
├─────────────────────────────────────────────────────────────┤
│                  DATABASE VIEWS & TABLES                   │
└─────────────────────────────────────────────────────────────┘
```

## Layer Descriptions

### 1. Database Layer (Views & Tables)

The foundation layer containing:
- **Tables**: Core data storage (users, posts, organizations, etc.)
- **Views**: Read-only aggregated data with computed fields (e.g., `posts_with_tags`, `people_with_tags`)
- **Functions**: Database-level operations and triggers

### 2. Repository Layer

Provides data access abstraction over the database:

#### Repository Types

**BaseRepository**
- Core CRUD operations (Create, Read, Update, Delete)
- Query building and execution
- Transaction support
- Error handling

**ViewRepository**
- Read-only operations for database views
- Optimized for querying aggregated data
- No mutation operations

**EntityRepository**
- Domain-specific repositories (ProfileRepository, OrganizationRepository)
- Business logic validation
- Entity-specific operations

#### Repository Features
- **Client Injection**: Support for testing with mock clients
- **Query Building**: Fluent API for building complex queries
- **Transformation**: Data transformation between database and domain models
- **Caching**: Built-in caching for frequently accessed data

### 3. API Operations Layer

Business logic layer that orchestrates repository operations:

#### Standard API Factory

Creates full CRUD operations for entities:

```typescript
createApiFactory<Entity, Id, CreateType, UpdateType>({
  tableName: 'table_name',
  entityName: 'entity',
  // Configuration options...
})
```

**Operations Created:**
- `getAll(params?)` - List entities with filtering/pagination
- `getById(id)` - Get single entity
- `getByIds(ids[])` - Get multiple entities
- `create(data)` - Create new entity
- `update(id, data)` - Update existing entity
- `delete(id)` - Delete entity
- `batchCreate(data[])` - Bulk create (optional)
- `batchUpdate(items[])` - Bulk update (optional)
- `batchDelete(ids[])` - Bulk delete (optional)

**Configuration Options:**
- `idField` - Primary key field name (default: 'id')
- `defaultSelect` - Default fields to select
- `defaultOrderBy` - Default sorting
- `softDelete` - Enable soft deletion
- `transformResponse` - Transform database records to domain objects
- `transformRequest` - Transform domain objects to database records
- `useMutationOperations` - Enable create/update/delete operations
- `useBatchOperations` - Enable batch operations

#### Relationship API Factory

Specialized for relationship entities (many-to-many associations):

```typescript
createRelationshipApiFactory<Entity, Id, CreateType, UpdateType>({
  tableName: 'relationship_table',
  // ... configuration
})
```

**Key Differences:**
- Excludes generic `create()` method to prevent misuse
- Includes all RUD operations (Read, Update, Delete)
- Relationship-specific validation hooks
- Cascade delete options
- Duplicate prevention

**Additional Options:**
- `validateRelationship(sourceId, targetId)` - Custom validation
- `onRelationshipCreated(relationship)` - Post-creation hooks
- `onRelationshipDeleted(id)` - Post-deletion hooks
- `cascadeDelete` - Delete related entities
- `preventDuplicates` - Prevent duplicate relationships

#### View API Factory

Read-only operations for database views:

```typescript
createViewApiFactory<Entity, Id>({
  viewName: 'view_name',
  entityName: 'entity',
  // ... configuration
})
```

**Operations Created:**
- `getAll(params?)` - List view records with filtering
- `getById(id)` - Get single view record
- `getByIds(ids[])` - Get multiple view records

**Configuration Options:**
- `idField` - Primary key field name
- `defaultSelect` - Default fields to select
- `defaultOrderBy` - Default sorting
- `transformResponse` - Transform view records to domain objects
- `enableLogging` - Enable operation logging

### 4. React Hooks Layer

Provides React Query integration and state management:

#### Hook Factory Types

**Standard Query Hooks** (from `createQueryHooks`)
- `useList(params?, options?)` - List entities with caching
- `useById(id, options?)` - Get single entity with caching
- `useByIds(ids[], options?)` - Get multiple entities with caching
- `useCreate(options?)` - Create mutation with optimistic updates
- `useUpdate(options?)` - Update mutation with cache invalidation
- `useDelete(options?)` - Delete mutation with cache cleanup
- `useBatchCreate(options?)` - Batch create mutation (if enabled)
- `useBatchUpdate(options?)` - Batch update mutation (if enabled)
- `useBatchDelete(options?)` - Batch delete mutation (if enabled)

**View Query Hooks** (from `createViewQueryHooks`)
- `useList(options?)` - List view records with caching
- `useById(id, options?)` - Get single view record with caching

**Relationship Hooks**
- All standard hooks except `useCreate`
- Relationship-specific mutation hooks

#### Hook Features
- **Automatic Caching**: React Query integration for optimal performance
- **Optimistic Updates**: Immediate UI updates before server confirmation
- **Error Handling**: Built-in error states and retry logic
- **Toast Notifications**: Success/error feedback for mutations
- **Cache Invalidation**: Smart cache updates after mutations

### 5. UI Components Layer

React components that consume hooks and display data:

#### Component Types

**Entity Components**
- Display and manipulate specific entity types
- Use entity-specific hooks
- Handle loading and error states

**Form Components**
- Create and edit entities
- Use mutation hooks
- Validation and error handling

**List Components**
- Display collections of entities
- Pagination and filtering
- Search functionality

## Data Flow

### Read Operations
1. Component calls hook (e.g., `useList()`)
2. Hook calls API operation (e.g., `getAll()`)
3. API operation calls repository method
4. Repository executes database query
5. Data flows back through layers with transformations

### Write Operations
1. Component calls mutation hook (e.g., `useCreate()`)
2. Hook calls API operation (e.g., `create()`)
3. API operation validates and calls repository
4. Repository executes database mutation
5. Success triggers cache invalidation and UI updates

## Factory Configuration Examples

### Standard Entity (Posts)
```typescript
export const postsApi = createApiFactory<Post, string, PostCreate, PostUpdate>({
  tableName: 'posts',
  entityName: 'post',
  defaultOrderBy: 'created_at',
  transformResponse: (data) => ({
    id: data.id,
    content: data.content,
    author_id: data.author_id,
    created_at: data.created_at
  }),
  useMutationOperations: true,
  useBatchOperations: false
});
```

### View-Only Entity (Posts with Tags)
```typescript
export const postsWithTagsApi = createViewApiFactory<PostWithTags, string>({
  viewName: 'posts_with_tags',
  entityName: 'postWithTags',
  defaultOrderBy: 'created_at',
  transformResponse: (data) => ({
    ...data,
    tags: data.tags || [],
    tag_names: data.tag_names || []
  })
});
```

### Relationship Entity (Organization Members)
```typescript
export const orgRelationshipsApi = createRelationshipApiFactory<OrgRelationship, string>({
  tableName: 'org_relationships',
  entityName: 'orgRelationship',
  validateRelationship: (profileId, orgId) => {
    // Custom validation logic
    return true;
  },
  preventDuplicates: true,
  cascadeDelete: false
});
```

## Best Practices

### Repository Layer
- Keep repositories focused on data access only
- Use dependency injection for testability
- Implement proper error handling
- Cache frequently accessed data

### API Layer
- Keep business logic in API operations
- Use appropriate factory type for the use case
- Configure transformations for clean domain models
- Enable only needed operations

### Hook Layer
- Use React Query best practices
- Implement proper loading states
- Handle errors gracefully
- Provide meaningful user feedback

### Component Layer
- Keep components focused on presentation
- Use hooks for all data operations
- Implement proper error boundaries
- Optimize for performance

## Testing Strategy

### Repository Testing
- Use test databases for integration tests
- Mock external dependencies
- Test error scenarios
- Validate data transformations

### API Testing
- Mock repository dependencies
- Test business logic validation
- Verify error handling
- Test configuration options

### Hook Testing
- Mock API operations
- Test React Query integration
- Verify cache behavior
- Test error states

### Component Testing
- Mock hooks
- Test user interactions
- Verify error handling
- Test accessibility

## Performance Considerations

### Caching Strategy
- Repository-level caching for database queries
- React Query caching for UI state
- View-based caching for computed data
- Strategic cache invalidation

### Query Optimization
- Use database views for complex queries
- Implement proper indexing
- Minimize data transfer
- Use pagination for large datasets

### Bundle Optimization
- Code splitting at the feature level
- Lazy loading for routes
- Tree shaking for unused code
- Optimize dependency imports

This architecture ensures maintainability, testability, and scalability while providing a clear separation of concerns across all layers of the application.
