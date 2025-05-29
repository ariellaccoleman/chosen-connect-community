
# Plan: Implement RelationshipApiOperations Pattern

## Overview
Create a new `RelationshipApiOperations` interface that extends `ApiOperations` but omits the generic `create` method and adds relationship-specific creation methods. This will provide type safety for relationship entities like tag assignments and organization relationships.

## Phase 1: Create Core Infrastructure

### 1.1 Create RelationshipApiOperations Interface
- **File**: `src/api/core/types.ts`
- Add `RelationshipApiOperations<T, TId, TCreate, TUpdate>` interface that:
  - Extends `Omit<ApiOperations<T, TId, TCreate, TUpdate>, 'create'>`
  - Removes the generic `create` method to prevent misuse
  - Maintains all RUD operations (Read, Update, Delete)
  - Provides a foundation for relationship-specific creation methods

### 1.2 Create Relationship Factory Types
- **File**: `src/api/core/factory/types.ts`
- Add `RelationshipFactoryOptions<T>` interface extending `ApiFactoryOptions<T>`
- Add relationship-specific configuration options

## Phase 2: Implement Tag Assignment Relationship Operations

### 2.1 Create TagAssignmentRelationshipOperations Interface
- **File**: `src/api/tags/factory/types.ts`
- Create interface extending `RelationshipApiOperations`
- Add relationship-specific methods:
  - `createAssignment(tagId: string, entityId: string, entityType: EntityType): Promise<ApiResponse<TagAssignment>>`
  - `getForEntity(entityId: string, entityType: EntityType): Promise<ApiResponse<TagAssignment[]>>`
  - `getEntitiesByTagId(tagId: string, entityType?: EntityType): Promise<ApiResponse<TagAssignment[]>>`
  - `deleteByTagAndEntity(tagId: string, entityId: string, entityType: EntityType): Promise<ApiResponse<boolean>>`
  - `deleteForEntity(entityId: string, entityType: EntityType): Promise<ApiResponse<boolean>>`
  - `isTagAssigned(tagId: string, entityId: string, entityType: EntityType): Promise<ApiResponse<boolean>>`

### 2.2 Create Relationship Factory Function
- **File**: `src/api/core/factory/apiFactory.ts`
- Add `createRelationshipApiFactory<T, TId, TCreate, TUpdate>()` function
- Returns `RelationshipApiOperations` with standard RUD operations
- Foundation for relationship-specific extensions

### 2.3 Update Tag Assignment Factory
- **File**: `src/api/tags/factory/tagApiFactory.ts`
- Add `createTagAssignmentRelationshipApi(client?: any): TagAssignmentRelationshipOperations`
- Combine relationship factory with business operations
- Maintain backward compatibility with existing `createExtendedTagAssignmentApi`

## Phase 3: Implement Organization Relationship Operations

### 3.1 Create Organization Relationship Types
- **File**: `src/api/organizations/types.ts` (new)
- Define `OrganizationRelationshipOperations` interface extending `RelationshipApiOperations`
- Add relationship-specific methods:
  - `createRelationship(profileId: string, organizationId: string, connectionType: string, department?: string, notes?: string): Promise<ApiResponse<ProfileOrganizationRelationship>>`
  - `getForProfile(profileId: string): Promise<ApiResponse<ProfileOrganizationRelationshipWithDetails[]>>`
  - `getForOrganization(organizationId: string): Promise<ApiResponse<ProfileOrganizationRelationshipWithDetails[]>>`

### 3.2 Migrate Organization Relationships API
- **File**: `src/api/organizations/relationshipApiFactory.ts` (new)
- Create factory function using relationship pattern
- Migrate existing `relationshipsApi.ts` functionality
- Maintain existing method signatures for backward compatibility

## Phase 4: Update Hook Factories

### 4.1 Create Relationship Hook Factory
- **File**: `src/hooks/core/factory/relationshipHooks.ts` (new)
- Create `createRelationshipHooks<T, TId, TCreate, TUpdate>()` function
- Handle relationship-specific mutation hooks
- Support custom creation method signatures

### 4.2 Update Existing Hook Implementations
- **File**: `src/hooks/tags/useTagHooks.ts`
- Update to use new `TagAssignmentRelationshipOperations`
- Ensure backward compatibility

## Phase 5: Update Consumers and Clean Up

### 5.1 Update Components
- Update tag assignment components to use new relationship APIs
- Update organization relationship components
- Ensure no breaking changes for existing functionality

### 5.2 Deprecation Plan
- Mark old factory functions as deprecated
- Add migration guide comments
- Plan removal timeline for deprecated functions

## Phase 6: Testing and Validation

### 6.1 Type Safety Validation
- Verify that `create` method cannot be called on relationship operations
- Test relationship-specific method type safety
- Ensure proper error messages for incorrect usage

### 6.2 Functional Testing
- Test all relationship creation scenarios
- Verify backward compatibility
- Test error handling and edge cases

## Benefits of This Approach

1. **Type Safety**: Build-time prevention of incorrect `create` calls
2. **Clear Intent**: Relationship operations are explicitly different from standard CRUD
3. **Consistency**: Same pattern for all relationship entities
4. **Extensibility**: Easy to add new relationship types
5. **Backward Compatibility**: Existing code continues to work
6. **Future-Proof**: Foundation for additional relationship patterns

## Implementation Dependencies

This plan coordinates with the Tag Hooks Factory Migration Plan:
- Both plans work together to create a consistent factory pattern
- The relationship operations will be consumed by the migrated tag hooks
- Hook factories need to support relationship-specific method signatures
- Testing should cover both the API and hook layers

## Timeline

- **Phase 1-2**: Core infrastructure and tag assignments (Week 1)
- **Phase 3**: Organization relationships (Week 2) 
- **Phase 4**: Hook factory updates (Week 2-3)
- **Phase 5-6**: Consumer updates and testing (Week 3-4)
