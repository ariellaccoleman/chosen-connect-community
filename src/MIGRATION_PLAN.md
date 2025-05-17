
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

- [ ] Fix inconsistent imports in AdminTags.tsx
- [ ] Create proper exports in hooks/tags/index.ts
- [ ] Consolidate tag query hooks
- [ ] Create clean redirections for all tag-related hooks

## Phase 5: Removal (To Do)

- [ ] Remove remaining ambiguous exports
- [ ] Fix import path inconsistencies
- [ ] Update remaining code to use only the modular imports
- [ ] Prepare for removal of deprecated files in next major version

## Component Inventory with Import Analysis

### Pages with Deprecated Imports

1. **src/pages/AdminTags.tsx**
   - Currently using: `import { useSelectionTags, useTagCrudMutations } from "@/hooks/tags";`
   - Needs to update to: `import { useSelectionTags, useTagCrudMutations } from "@/hooks/tags";`

2. **src/pages/CommunityDirectory.tsx**
   - Currently using: `import { useTagFilter } from "@/hooks/useTagFilter";`
   - Needs to update to: `import { useTagFilter } from "@/hooks/tags";`

### Components with Deprecated Imports

1. **src/components/tags/EntityTagManager.tsx**
   - Currently using: `import { useEntityTags, useTagAssignmentMutations } from "@/hooks/tags";`
   - No change needed - these are the correct imports

2. **src/components/events/form/EventTagsManager.tsx**
   - Currently using: `import EntityTagManager from "@/components/tags/EntityTagManager";`
   - No change needed - these are the correct imports

3. **src/components/tags/TagSelector/TagSelectorComponent.tsx**
   - Currently using: Imports from `@/utils/tags`
   - No change needed - these are the correct imports

### Re-export Files To Consolidate

1. **src/hooks/tags/index.ts**
   - Need to properly re-export both:
     - All hooks from hooks/tag directory
     - All hooks from hooks/tags directory
     - Fixed re-export of `useSelectionTags`

2. **src/hooks/useTagQueries.ts**
   - Need to properly re-export from `./tags/useTagQueryHooks`
   - Add deprecation warning 

3. **src/hooks/useTagMutations.ts**
   - Need to properly re-export from `./tags`
   - Add deprecation warning 

4. **src/hooks/useTags.ts**
   - Need to properly re-export from `./tags`
   - Add deprecation warning

### Legacy Files To Clean Up

1. **src/hooks/index.ts**
   - Contains ambiguous exports that should be removed
   - Should use direct imports from specific modules

2. **src/hooks/tag/index.ts**
   - Need to consolidate with `hooks/tags/index.ts`

3. **src/utils/tagUtils.ts**
   - Re-exporting from `./tags`
   - Need deprecation warning
   - Should be removed after all imports are updated

## Migration Priorities

1. Fix inconsistent imports in AdminTags.tsx and CommunityDirectory.tsx
2. Consolidate tag hooks (move all hooks from hooks/tag to hooks/tags)
3. Ensure clean re-exports with deprecation warnings
4. Remove ambiguous exports from hooks/index.ts
5. Clean up remaining legacy re-export files

## Benefits of Consolidation

1. **Simplified Imports**: Import all tag functionality from one place (`hooks/tags`)
2. **Reduced Duplication**: All tag-related functionality in one place
3. **Better Organization**: Hooks grouped by function (CRUD, queries, assignments)
4. **Clearer Deprecation Path**: Legacy files clearly indicate their replacements

## Timeline for Deprecation Removal

- **Q2 2025:** Finish all component migrations to new import structure
- **Q3 2025:** Start emitting console warnings for deprecated imports
- **Q4 2025:** Release major version update that removes deprecated files
