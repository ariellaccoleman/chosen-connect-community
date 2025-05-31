
# Simplify API Factory Pattern & Tag Handling

## Overview

This plan simplifies the tag handling system by eliminating `TagAssignment[]` complexity from the UI layer and making view APIs the default for entity display operations. Components will work with simple `Tag[]` arrays and use straightforward `assignTag(tagId, entityId, entityType)` / `removeTag(tagId, entityId, entityType)` operations.

## Phase 1: Update Entity Interfaces and Types

### 1.1 Update Entity Interface
**File: `src/types/entity.ts`**
- Change `tags?: TagAssignment[]` to `tags?: Tag[]`
- This removes assignment complexity from the UI layer
- Components will only see simple tag objects, not assignment metadata

### 1.2 Create View-Based Entity APIs
Create dedicated view APIs for each entity type:
- `organizationsWithTagsApi` using `organizations_with_tags` view
- `peopleWithTagsApi` using `people_with_tags` view  
- `eventsWithTagsApi` using `events_with_tags` view
- These will become the default for display/listing operations

## Phase 2: Simplify useEntityFeed Hook

### 2.1 Replace Complex Tag Fetching
**File: `src/hooks/useEntityFeed.ts`**
- Use view APIs (`*_with_tags`) instead of base APIs + separate tag fetching
- Remove manual tag assignment fetching loops
- Eliminate client-side tag joining logic

### 2.2 Simplify Tag Filtering Logic
- Replace complex client-side filtering with database-level filtering
- Use `tags @> '[{"id": "tag-id"}]'` queries for tag-based filtering
- Filter directly in the view queries rather than post-processing

## Phase 3: Update Hooks to Use Simple Tag API

### 3.1 Modify useTagFactoryHooks
**File: `src/hooks/tags/useTagFactoryHooks.ts`**
- Keep existing `useEntityTags` for backward compatibility
- Add new simplified hooks that return `Tag[]` instead of `TagAssignment[]`
- Update mutation hooks to use simple APIs:
  - `tagApi.createAssignment(tagId, entityId, entityType)`
  - `tagApi.deleteByTagAndEntity(tagId, entityId, entityType)`

### 3.2 Hide Assignment IDs from Components
- Components should never see or handle assignment IDs
- All tag operations use tag ID + entity ID/type combinations
- Remove assignment ID parameters from component interfaces

## Phase 4: Update Display Components

### 4.1 Simplify TagList Component
**File: `src/components/tags/TagList.tsx`**
- Remove `TagAssignment[]` support, only accept `Tag[]`
- Remove assignment ID handling from remove operations
- Use tag ID + entity context for removal operations
- Simplify the component interface

### 4.2 Update EntityCard and Display Components
**Files: `src/components/entities/EntityCard.tsx`, `src/components/community/ProfileCard.tsx`, etc.**
- Expect `entity.tags` to be `Tag[]` (simple tag objects)
- Remove any TagAssignment-related logic
- Update prop types and interfaces

### 4.3 Update EntityTagDisplay
**File: `src/components/tags/EntityTagDisplay.tsx`**
- Prefer pre-loaded tags from view APIs
- Fallback to simplified tag fetching when needed
- Remove assignment-specific logic

## Phase 5: Update Entity Registry and Conversion

### 5.1 Update Entity Conversion Logic
**File: `src/components/entities/EntityCardFactory.tsx`**
- When converting from view data, map aggregated tags to simple `Tag[]`
- When converting from base table data, keep existing tag assignment fetching as fallback
- Ensure consistent tag format across all entity types

### 5.2 Update Entity System Hooks
**File: `src/hooks/useEntitySystem.ts`**
- Ensure entity conversion handles both view and base table data
- Standardize tag format conversion

## Phase 6: Make View APIs the Default

### 6.1 Update Entity Listing/Display Code
**Files: `src/components/entities/EntityFeed.tsx`, `src/pages/CommunityDirectory.tsx`, etc.**
- Use view APIs (`*WithTagsApi`) by default for feeds, lists, cards
- Keep standard APIs for forms, creation, editing
- View APIs provide read-only access with pre-loaded tags

### 6.2 Update API Factory Configuration
**Files: `src/api/*/factory/*ApiFactory.ts`**
- Configure view operations to use `*_with_tags` views
- Ensure proper type mapping from view data to entity objects
- Maintain separation between read (view) and write (standard) operations

## Implementation Notes

### API Layer Changes
- **Standard APIs**: Continue using base tables for CRUD operations
- **View APIs**: Use `*_with_tags` views for read operations with pre-loaded tags
- **Relationship APIs**: Keep for complex relationship management

### Component Layer Changes
- **Display Components**: Use view APIs, work with `Tag[]`
- **Form Components**: Use standard APIs for mutations
- **Tag Operations**: Simple `assignTag`/`removeTag` functions

### Hook Layer Changes
- **Read Hooks**: Prefer view APIs for entity listing/display
- **Mutation Hooks**: Use simplified tag assignment/removal APIs
- **Legacy Support**: Maintain backward compatibility where needed

## Expected Benefits

### Performance Improvements
- **Pre-loaded Tags**: Views eliminate N+1 queries for tag data
- **Reduced Client Processing**: Database handles tag aggregation
- **Fewer Network Requests**: Single query returns entity + tags

### Code Simplification
- **Component Simplicity**: No more `TagAssignment[]` complexity in UI
- **Consistent Interface**: All display components expect `Tag[]` format
- **Cleaner APIs**: Simple tag operations hide assignment details

### Maintainability
- **Clear Separation**: Read (view APIs) vs write (standard APIs) operations
- **Type Safety**: Consistent tag format across components
- **Reduced Coupling**: Components don't depend on assignment implementation

## Migration Strategy

### Phase-by-Phase Implementation
1. **Types First**: Update entity interface to use `Tag[]`
2. **APIs Second**: Create and configure view APIs
3. **Hooks Third**: Update hooks to use new APIs
4. **Components Last**: Update display components to use simplified interface

### Backward Compatibility
- Keep existing hooks for components that haven't been migrated yet
- Gradually migrate components to use new simplified APIs
- Remove legacy code once all components are updated

### Testing Strategy
- Unit test each phase independently
- Integration test view API data consistency
- End-to-end test tag operations (assign/remove)

## Database Impact

### No Schema Changes Required
- All existing tables and views remain unchanged
- RLS policies stay the same
- No migration scripts needed

### Performance Considerations
- Views may need proper indexing for optimal performance
- Monitor query performance on aggregated tag data
- Consider materialized views for large datasets if needed

## Risk Mitigation

### Gradual Migration
- Implement changes incrementally
- Test each phase thoroughly before proceeding
- Maintain rollback capability

### Type Safety
- Use TypeScript to catch interface mismatches
- Update all type definitions consistently
- Ensure proper error handling

### Performance Monitoring
- Monitor database query performance
- Track component rendering performance
- Optimize view queries if needed
