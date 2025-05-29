
# Frontend Tag Migration Plan

## Overview
This document outlines the plan to migrate frontend components from legacy tag hooks to factory-based hooks to resolve tag functionality issues.

## Current Issues
1. **Tags not showing on profile pages** - Components using deprecated hooks with direct API imports
2. **Adding tags to events doesn't work** - TagSelector components have direct API calls instead of using hooks
3. **Test failures** - Legacy hooks cause early repository instantiation during imports

## Root Cause
Components are still using deprecated legacy hooks (`useTagHooks.ts`) which have direct API imports, instead of the new factory-based hooks (`useTagFactoryHooks.ts`). Additionally, `TagSelector` components bypass the hook system entirely with direct API calls.

## Migration Plan

### Phase 1: Update Core Tag Components

#### 1.1 Update `EntityTagManager.tsx`
- **Current**: Uses `useEntityTags`, `useTagAssignmentMutations` from `useTagHooks.ts`
- **Target**: Use `useEntityTags`, `useTagAssignmentMutations` from factory-based hooks
- **Impact**: Fixes tag display and assignment on all entity pages

#### 1.2 Update `PublicProfileTags.tsx`
- **Current**: Uses `useEntityTags` from `useTagHooks.ts`
- **Target**: Use `useEntityTags` from factory-based hooks
- **Impact**: Fixes tag display on public profile pages

#### 1.3 Update remaining components
Components that need migration:
- `Dashboard.tsx` (if using tag hooks)
- `ProfileView.tsx` (if using tag hooks)
- `ChatChannelList.tsx` (if using tag hooks)

### Phase 2: Fix TagSelector Components

#### 2.1 Update `TagSelectorComponent.tsx`
- **Current**: Direct API calls to `tagApi.getById()`, `tagApi.searchByName()`, `tagApi.getByEntityType()`
- **Target**: Replace with proper hooks:
  - Use `useSelectionTags()` for loading tags
  - Use `useTagCrudMutations()` for tag creation
  - Use proper React Query patterns for data fetching
- **Impact**: Fixes tag selection and creation in all forms

#### 2.2 Update related TagSelector components
- Ensure all TagSelector sub-components use hooks instead of direct API calls
- Update `TagSearch.tsx`, `CreateTagDialog.tsx` if they have direct API usage

### Phase 3: Clean Up Legacy Code

#### 3.1 Deprecate legacy hook files
- Add clear deprecation warnings to `useTagHooks.ts`
- Update documentation to point to factory-based hooks
- Plan eventual removal after full migration

#### 3.2 Update import paths
- Update `src/hooks/tags/index.ts` to prioritize factory-based exports
- Ensure backward compatibility during transition
- Remove confusing re-exports

#### 3.3 Run comprehensive tests
- Verify all tag functionality works correctly
- Ensure no test failures due to direct API imports
- Test both read and write operations

### Phase 4: Verification and Testing

#### 4.1 Test profile tag functionality
- [ ] Profile tags display correctly on view pages
- [ ] Profile tags can be added/removed on edit pages
- [ ] Public profile tags show properly

#### 4.2 Test event tag functionality
- [ ] Event tags can be added during creation
- [ ] Event tags can be modified during editing
- [ ] Event tag assignment works properly

#### 4.3 Test organization tag functionality
- [ ] Organization tags display on detail pages
- [ ] Organization tags can be managed by admins
- [ ] Tag permissions work correctly

#### 4.4 Verify CRUD operations
- [ ] Tag creation works from all contexts
- [ ] Tag assignment/removal works properly
- [ ] Tag search and selection functions correctly
- [ ] All mutations update cache properly

## Implementation Steps

### Step 1: Update Core Components
1. Migrate `EntityTagManager.tsx` to use factory hooks
2. Migrate `PublicProfileTags.tsx` to use factory hooks
3. Test basic tag display functionality

### Step 2: Fix TagSelector System
1. Refactor `TagSelectorComponent.tsx` to use hooks instead of direct API calls
2. Update tag loading, searching, and creation to use proper React Query patterns
3. Test tag selection and creation functionality

### Step 3: Comprehensive Testing
1. Test all tag functionality across the application
2. Verify no regressions in existing features
3. Ensure all tests pass without import-related failures

### Step 4: Clean Up
1. Add deprecation warnings to legacy hooks
2. Update documentation and comments
3. Plan removal of legacy code after verification period

## Expected Outcomes

After completing this migration:
- ✅ Tags will display properly on profile pages
- ✅ Tag assignment to events will work correctly
- ✅ All tag CRUD operations will function properly
- ✅ Tests will pass without import-related failures
- ✅ Code will be more maintainable with consistent patterns
- ✅ Factory pattern will be fully implemented for tag system

## Files to be Modified

### Core Components
- `src/components/tags/EntityTagManager.tsx`
- `src/components/profile/PublicProfileTags.tsx`

### TagSelector System
- `src/components/tags/TagSelector/TagSelectorComponent.tsx`
- `src/components/tags/TagSelector/TagSearch.tsx` (if needed)
- `src/components/tags/TagSelector/CreateTagDialog.tsx` (if needed)

### Hook System
- `src/hooks/tags/index.ts` (cleanup exports)
- `src/hooks/tags/useTagHooks.ts` (add deprecation warnings)

### Testing
- Verify all existing tests pass
- Add integration tests for tag functionality if needed

## Risk Mitigation

- Keep legacy hooks available during transition
- Test each component migration individually
- Maintain backward compatibility until full migration
- Have rollback plan if issues arise

## Success Criteria

1. All tag functionality works as expected
2. No build or runtime errors
3. All tests pass
4. Performance is maintained or improved
5. Code is more maintainable and follows factory pattern consistently
