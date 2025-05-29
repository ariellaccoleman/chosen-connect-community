

# Tag Hooks Factory Migration Plan

## Overview
Migrate tag-related hooks to use the new hook factory pattern while implementing the RelationshipApiOperations interface. This migration works in coordination with the RelationshipApiOperations implementation to create a consistent, type-safe API pattern.

## Current State Analysis
- Tag hooks are currently using mixed patterns and direct API calls
- Some hooks use the extended tag assignment API with business operations
- Hook implementations are scattered across multiple files
- Type safety could be improved with standardized interfaces

## Migration Phases

### Phase 1: Fix Immediate Build Errors ✅ COMPLETED
- [x] Fixed type export syntax in `src/api/tags/factory/types.ts`
- [x] Updated all `create()` calls to use `createAssignment()` method
- [x] Ensured all imports and method calls are consistent

### Phase 2: Implement RelationshipApiOperations for Tag Assignments ✅ COMPLETED
**Goal**: Create the relationship operations interface and update tag assignment factory

#### 2.1 Create Core Relationship Infrastructure ✅ COMPLETED
- [x] Update `src/api/core/types.ts` to add `RelationshipApiOperations<T, TId, TCreate, TUpdate>` interface
- [x] This interface extends `Omit<ApiOperations<T, TId, TCreate, TUpdate>, 'create'>` to remove generic create
- [x] Update `src/api/core/factory/types.ts` to add `RelationshipFactoryOptions<T>`

#### 2.2 Update Tag Assignment Factory ✅ COMPLETED
- [x] Update `src/api/tags/factory/tagApiFactory.ts` to return `RelationshipApiOperations` for tag assignments
- [x] Ensure backward compatibility with existing `createExtendedTagAssignmentApi`
- [x] Create new `createTagAssignmentRelationshipApi()` function

#### 2.3 Update Hook Factories ⚠️ PARTIALLY COMPLETED
- [x] Tag assignment hooks are using the new relationship operations interface via `tagAssignmentApi`
- [x] Type safety prevents calling generic `create` method (uses `createAssignment` instead)
- [x] Existing hook signatures maintained for backward compatibility
- [ ] **PENDING**: Need dedicated relationship hook factories for cleaner separation

### Phase 3: Implement Organization Relationship Operations ✅ COMPLETED
**Goal**: Create organization relationship operations using the same pattern

#### 3.1 Create Organization Relationship Types ✅ COMPLETED
- [x] Created `src/api/organizations/types.ts` with `OrganizationRelationshipOperations` interface
- [x] Added relationship-specific methods for organization connections

#### 3.2 Migrate Organization Relationships API ✅ COMPLETED
- [x] Created `src/api/organizations/relationshipApiFactory.ts` using relationship pattern
- [x] Updated `src/api/organizations/relationshipsApi.ts` to return created relationship objects
- [x] Fixed type compatibility issues between API factory and underlying operations
- [x] Maintained existing method signatures for backward compatibility

### Phase 4: Create Dedicated Relationship Hook Factories **NEXT STEP**
**Goal**: Create focused hook modules for relationship operations

#### 4.1 Create Relationship Hook Factory ⏳ PENDING
- **File**: `src/hooks/core/factory/relationshipHooks.ts` (new)
- Create `createRelationshipHooks<T, TId, TCreate, TUpdate>()` function
- Handle relationship-specific mutation hooks (no generic `create`)
- Support custom creation method signatures like `createAssignment`, `createRelationship`

#### 4.2 Create Dedicated Relationship Hook Files ⏳ PENDING
- **File**: `src/hooks/tags/useTagAssignmentRelationshipHooks.ts` (new)
- **File**: `src/hooks/organizations/useOrganizationRelationshipHooks.ts` (new)
- Create focused hooks using the new relationship hook factory
- Migrate logic from existing hook files to new relationship-specific hooks
- Maintain backward compatibility by keeping existing hooks as wrappers

### Phase 5: Clean Up and Optimization
**Goal**: Remove deprecated code and optimize the new structure

#### 5.1 Remove Deprecated Exports
- Mark old factory functions as deprecated in `tagApiFactory.ts`
- Plan removal timeline for deprecated functions
- Update documentation and migration guides

#### 5.2 Final Testing and Validation
- Test all tag-related functionality
- Verify backward compatibility
- Ensure type safety across all operations

## Benefits of This Migration
1. **Consistent Hook Pattern**: All relationship hooks follow the same factory pattern
2. **Type Safety**: Relationship operations prevent incorrect method calls
3. **Better Organization**: Focused, single-responsibility hook modules
4. **Future-Proof**: Foundation for additional relationship entities
5. **Backward Compatibility**: Existing code continues to work during transition

## Dependencies and Coordination
This migration works hand-in-hand with the RelationshipApiOperations plan:
- Both implement the same relationship operations interface
- Hook factories consume the relationship API operations
- Type safety is enforced at both API and hook layers
- Testing covers both implementation layers

---

# Plan: Implement RelationshipApiOperations Pattern ✅ PHASE 2-3 COMPLETED

## Overview
Create a new `RelationshipApiOperations` interface that extends `ApiOperations` but omits the generic `create` method and adds relationship-specific creation methods. This will provide type safety for relationship entities like tag assignments and organization relationships.

## Phase 1: Create Core Infrastructure ✅ COMPLETED

### 1.1 Create RelationshipApiOperations Interface ✅ COMPLETED
- **File**: `src/api/core/types.ts`
- [x] Add `RelationshipApiOperations<T, TId, TCreate, TUpdate>` interface that:
  - [x] Extends `Omit<ApiOperations<T, TId, TCreate, TUpdate>, 'create'>`
  - [x] Removes the generic `create` method to prevent misuse
  - [x] Maintains all RUD operations (Read, Update, Delete)
  - [x] Provides a foundation for relationship-specific creation methods

### 1.2 Create Relationship Factory Types ✅ COMPLETED
- **File**: `src/api/core/factory/types.ts`
- [x] Add `RelationshipFactoryOptions<T>` interface extending `ApiFactoryOptions<T>`
- [x] Add relationship-specific configuration options

## Phase 2: Implement Tag Assignment Relationship Operations ✅ COMPLETED

### 2.1 Create TagAssignmentRelationshipOperations Interface ✅ COMPLETED
- **File**: `src/api/tags/factory/types.ts`
- [x] Create interface extending `RelationshipApiOperations`
- [x] Add relationship-specific methods:
  - [x] `createAssignment(tagId: string, entityId: string, entityType: EntityType): Promise<ApiResponse<TagAssignment>>`
  - [x] `getForEntity(entityId: string, entityType: EntityType): Promise<ApiResponse<TagAssignment[]>>`
  - [x] `getEntitiesByTagId(tagId: string, entityType?: EntityType): Promise<ApiResponse<TagAssignment[]>>`
  - [x] `deleteByTagAndEntity(tagId: string, entityId: string, entityType: EntityType): Promise<ApiResponse<boolean>>`
  - [x] `deleteForEntity(entityId: string, entityType: EntityType): Promise<ApiResponse<boolean>>`
  - [x] `isTagAssigned(tagId: string, entityId: string, entityType: EntityType): Promise<ApiResponse<boolean>>`

### 2.2 Create Relationship Factory Function ✅ COMPLETED
- **File**: `src/api/core/factory/apiFactory.ts`
- [x] Add `createRelationshipApiFactory<T, TId, TCreate, TUpdate>()` function
- [x] Returns `RelationshipApiOperations` with standard RUD operations
- [x] Foundation for relationship-specific extensions

### 2.3 Update Tag Assignment Factory ✅ COMPLETED
- **File**: `src/api/tags/factory/tagApiFactory.ts`
- [x] Add `createTagAssignmentRelationshipApi(client?: any): TagAssignmentRelationshipOperations`
- [x] Combine relationship factory with business operations
- [x] Maintain backward compatibility with existing `createExtendedTagAssignmentApi`

## Phase 3: Implement Organization Relationship Operations ✅ COMPLETED

### 3.1 Create Organization Relationship Types ✅ COMPLETED
- **File**: `src/api/organizations/types.ts`
- [x] Define `OrganizationRelationshipOperations` interface extending `RelationshipApiOperations`
- [x] Add relationship-specific methods:
  - [x] `createRelationship(profileId: string, organizationId: string, connectionType: string, department?: string, notes?: string): Promise<ApiResponse<ProfileOrganizationRelationship>>`
  - [x] `getForProfile(profileId: string): Promise<ApiResponse<ProfileOrganizationRelationshipWithDetails[]>>`
  - [x] `getForOrganization(organizationId: string): Promise<ApiResponse<ProfileOrganizationRelationshipWithDetails[]>>`

### 3.2 Migrate Organization Relationships API ✅ COMPLETED
- **File**: `src/api/organizations/relationshipApiFactory.ts`
- [x] Create factory function using relationship pattern
- [x] Migrate existing `relationshipsApi.ts` functionality
- [x] Fix type compatibility by updating `addOrganizationRelationship` to return created relationship
- [x] Maintain existing method signatures for backward compatibility

## Phase 4: Update Hook Factories **NEXT STEP**

### 4.1 Create Relationship Hook Factory ⏳ PENDING
- **File**: `src/hooks/core/factory/relationshipHooks.ts` (new)
- Create `createRelationshipHooks<T, TId, TCreate, TUpdate>()` function
- Handle relationship-specific mutation hooks
- Support custom creation method signatures

### 4.2 Create Dedicated Relationship Hook Files ⏳ PENDING
- **File**: `src/hooks/tags/useTagAssignmentRelationshipHooks.ts` (new)
- **File**: `src/hooks/organizations/useOrganizationRelationshipHooks.ts` (new)
- Create focused hooks using relationship pattern
- Migrate logic from existing files to new relationship-specific hooks
- Maintain backward compatibility

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

- **Phase 1-2**: Core infrastructure and tag assignments (Week 1) ✅ COMPLETED
- **Phase 3**: Organization relationships (Week 2) ✅ COMPLETED
- **Phase 4**: Hook factory updates (Week 2-3) **CURRENT**
- **Phase 5-6**: Consumer updates and testing (Week 3-4)

