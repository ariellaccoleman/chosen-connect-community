
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

- [x] Fixed inconsistent imports in AdminTags.tsx
- [x] Created proper exports in hooks/tags/index.ts
- [x] Consolidated tag query hooks
- [x] Created clean redirections for all tag-related hooks

## Phase 5: Removal (To Do)

- [ ] Remove remaining ambiguous exports
- [ ] Fix import path inconsistencies
- [ ] Update remaining code to use only the modular imports
- [ ] Prepare for removal of deprecated files in next major version

## Updated Inventory of Components After Tag Consolidation

### Pages

1. **src/pages/AdminTags.tsx**
   - Fixed: Now using `import { useSelectionTags } from "@/hooks/useTagQueries";`
   - Fixed: Now using `import { useTagCrudMutations } from "@/hooks/tag";`
   - Future migration: Should update to `import { useSelectionTags, useTagCrudMutations } from "@/hooks/tags";`

2. **src/components/tags/EntityTagManager.tsx**
   - Currently using: `import { useEntityTags, useTagAssignmentMutations } from "@/hooks/useTags";`
   - Future migration: Should update to `import { useEntityTags, useTagAssignmentMutations } from "@/hooks/tags";`

3. **src/components/tags/TagSelector/TagSelectorComponent.tsx**
   - Currently using imports from `@/utils/tags`
   - This is the correct path, but may need review for consistency

### Re-export Files Updated or Consolidated

1. **src/hooks/tags/index.ts**
   - Now properly exporting all tag-related hooks
   - Fixed missing useSelectionTags export

2. **src/hooks/useTagQueries.ts**
   - Now properly re-exporting from `./tags/useTagQueryHooks`
   - Includes deprecation warning in development

3. **src/hooks/useTagMutations.ts**
   - Now properly re-exporting from `./tags`
   - Includes deprecation warning in development

4. **src/hooks/useTags.ts**
   - Now properly re-exporting from `./tags`
   - Includes deprecation warning in development

### Remaining Re-export Files To Clean Up

1. **src/hooks/index.ts**
   - Contains ambiguous exports that should be removed
   - Should use direct imports from specific modules

2. **src/hooks/tag/index.ts**
   - Will be removed in next phase after all imports are updated to use hooks/tags

3. **src/utils/tagUtils.ts**
    - Re-exporting from `./tags`
    - Should be removed after all imports are updated

## Next Steps

1. Continue fixing imports in components to use the consolidated modules directly
2. Complete the consolidation of tag hooks by moving all tag hooks from hooks/tag to hooks/tags
3. Remove ambiguous exports from hooks/index.ts
4. Clean up remaining legacy re-export files

## Benefits of the Consolidated Structure

1. **Simplified Imports**: Instead of having to remember whether to import from `hooks/tag` or `hooks/tags`, developers can now import everything from `hooks/tags`
2. **Reduced Duplication**: All tag-related functionality is now in one place
3. **Better Organized**: Hooks are now grouped by function (CRUD, queries, assignments)
4. **Clearer Deprecation Path**: Legacy files now clearly indicate their replacements

## Timeline for Deprecation Removal

- **Q2 2025:** Finish all component migrations to new import structure
- **Q3 2025:** Start emitting console warnings for deprecated imports
- **Q4 2025:** Release major version update that removes deprecated files
