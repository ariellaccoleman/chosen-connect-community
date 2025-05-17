
# Modular Structure Migration Plan

This document outlines the plan for migrating the codebase from a monolithic structure to a more modular organization. The migration will be done in phases to minimize disruption.

## Current Status

Phase 4 of the migration is in progress. The codebase now has:

1. New modular structure fully in place
2. Legacy files properly marked with deprecation notices
3. Runtime console warnings for deprecated imports
4. Clean redirection from legacy files to their modular counterparts
5. Streamlined factory pattern implementation
6. Tag-related hooks consolidated in `hooks/tags`

## Phase 1: Deprecation Notices (Completed)

- [x] Mark legacy files with `@deprecated` JSDoc tags
- [x] Add documentation for preferred import patterns
- [x] Create migration plan document
- [x] Add README files to document module structure

## Phase 2: Deprecation Warnings (Completed)

- [x] Add runtime console warnings in development mode for deprecated imports
- [x] Document preferred import paths
- [x] Create clean redirection files for backward compatibility

## Phase 3: Streamlined Factory Pattern (Completed)

- [x] Updated all legacy files to be clean redirection files
- [x] Removed duplicated implementations 
- [x] Improved documentation of module structure
- [x] Standardized deprecation warning messages

## Phase 4: Tag Consolidation (In Progress)

- [x] Fix exports in hooks/tags/index.ts
- [x] Update AdminTags.tsx to use consistent imports
- [x] Consolidate tag query hooks in hooks/tags/useTagQueryHooks.ts
- [x] Move hooks from hooks/tag to hooks/tags/useTagCrudHooks.ts and useTagAssignmentHooks.ts
- [x] Create clean redirections for all tag-related hooks
- [ ] Update CommunityDirectory.tsx to use hooks from @/hooks/tags
- [ ] Update useTagFilter to import from @/hooks/tags

## Phase 5: Removal (To Do)

- [ ] Remove remaining ambiguous exports
- [ ] Fix import path inconsistencies
- [ ] Update remaining code to use only the modular imports
- [ ] Prepare for removal of deprecated files in next major version

## Component Inventory with Import Analysis

### Pages with Deprecated Imports

1. **src/pages/AdminTags.tsx**
   - Status: ✅ Fixed
   - Old: `import { useSelectionTags, useTagCrudMutations } from "@/hooks/tags";`
   - New: `import { useSelectionTags, useTagCrudMutations } from "@/hooks/tags";`

2. **src/pages/CommunityDirectory.tsx**
   - Status: ⚠️ Needs Update
   - Current: `import { useTagFilter } from "@/hooks/useTagFilter";`
   - Needs to update to: `import { useFilterTags } from "@/hooks/tags";`
   - Note: Will need to refactor the useTagFilter hook functionality into this component

### Components with Deprecated Imports

1. **src/components/tags/EntityTagManager.tsx**
   - Status: ✅ Using correct imports
   - Current: `import { useEntityTags, useTagAssignmentMutations } from "@/hooks/tags";`

2. **src/components/events/form/EventTagsManager.tsx**
   - Status: ✅ Using correct imports
   - Current: `import EntityTagManager from "@/components/tags/EntityTagManager";`

3. **src/components/tags/TagSelector/TagSelectorComponent.tsx**
   - Status: ✅ Using correct imports
   - Current: Imports from `@/utils/tags`

### Re-export Files Consolidated

1. **src/hooks/tags/index.ts**
   - Status: ✅ Fixed
   - Now properly re-exports all hooks from:
     - hooks/tags/useTagsHooks
     - hooks/tags/useTagQueryHooks
     - hooks/tags/useTagCrudHooks
     - hooks/tags/useTagAssignmentHooks

2. **src/hooks/useTagQueries.ts**
   - Status: ✅ Properly re-exports with deprecation warnings
   - Current: Re-exports from `./tags`

3. **src/hooks/useTagMutations.ts**
   - Status: ✅ Properly re-exports with deprecation warnings
   - Current: Re-exports from `./tags`

4. **src/hooks/useTags.ts**
   - Status: ✅ Properly re-exports with deprecation warnings
   - Current: Re-exports from `./tags`

5. **src/hooks/useTagFilter.ts**
   - Status: ⚠️ Needs Refactoring
   - Current: Contains implementation, not just re-exports
   - Should re-export from `./tags` and add deprecation warning

### Legacy Files Consolidated

1. **src/hooks/tag/index.ts**
   - Status: ✅ All hooks moved to hooks/tags
   - Implementation has been consolidated in hooks/tags

2. **src/hooks/tag/useTagCrudMutations.ts**
   - Status: ✅ Moved to hooks/tags/useTagCrudHooks.ts

3. **src/hooks/tag/useTagAssignmentMutations.ts**
   - Status: ✅ Moved to hooks/tags/useTagAssignmentHooks.ts

4. **src/hooks/tag/useTagFindOrCreate.ts**
   - Status: ✅ Moved to hooks/tags/useTagCrudHooks.ts

5. **src/hooks/tag/useTagEntityType.ts**
   - Status: ✅ Moved to hooks/tags/useTagCrudHooks.ts

6. **src/hooks/tag/useTagBasicCrud.ts**
   - Status: ✅ Moved to hooks/tags/useTagCrudHooks.ts

7. **src/hooks/tag/useTagCreation.ts**
   - Status: ✅ Moved to hooks/tags/useTagCrudHooks.ts

### API Structure

1. **src/api/tags/index.ts**
   - Status: ✅ Properly organized
   - Current: Correctly re-exports all tag-related API functions

2. **src/utils/tags/index.ts**
   - Status: ✅ Properly organized
   - Current: Correctly re-exports all tag utility functions

## Migration Priorities

1. ✅ Fix exports in hooks/tags/index.ts
2. ✅ Update AdminTags.tsx to use consistent imports
3. ✅ Consolidate tag hooks (move all hooks from hooks/tag to hooks/tags)
4. ⚠️ Update CommunityDirectory.tsx to use hooks from @/hooks/tags
5. ⚠️ Refactor useTagFilter.ts to use hooks from @/hooks/tags
6. ⚠️ Remove ambiguous exports from hooks/index.ts

## Benefits of Consolidation

1. **Simplified Imports**: Import all tag functionality from one place (`hooks/tags`)
2. **Reduced Duplication**: All tag-related functionality in one place
3. **Better Organization**: Hooks grouped by function (CRUD, queries, assignments)
4. **Clearer Deprecation Path**: Legacy files clearly indicate their replacements

## Timeline for Deprecation Removal

- **Q2 2025:** Finish all component migrations to new import structure
- **Q3 2025:** Start emitting console warnings for deprecated imports
- **Q4 2025:** Release major version update that removes deprecated files
