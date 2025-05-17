
# Modular Structure Migration Plan

This document outlines the plan for migrating the codebase from a monolithic structure to a more modular organization. The migration will be done in phases to minimize disruption.

## Current Status

Phase 6 is in progress. The codebase now has:

1. New modular structure fully in place
2. Legacy files properly marked with deprecation notices 
3. Runtime console warnings for deprecated imports
4. Clean redirection from legacy files to their modular counterparts
5. Streamlined factory pattern implementation
6. Tag-related hooks consolidated in `hooks/tags`
7. All components updated to use the consolidated hook structure
8. All deprecated import references updated to their new modular counterparts
9. Early cleanup of deprecated tag-related files (ahead of schedule)

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

## Phase 4: Tag Consolidation (Completed)

- [x] Fix exports in hooks/tags/index.ts
- [x] Update AdminTags.tsx to use consistent imports
- [x] Consolidate tag query hooks in hooks/tags/useTagQueryHooks.ts
- [x] Move hooks from hooks/tag to hooks/tags/useTagCrudHooks.ts and useTagAssignmentHooks.ts
- [x] Create clean redirections for all tag-related hooks
- [x] Update CommunityDirectory.tsx to use hooks from @/hooks/tags
- [x] Update useTagFilter to import from @/hooks/tags

## Phase 5: Component Migration (Completed)

- [x] Update EntityFeed.tsx to use hooks from @/hooks/tags
- [x] Update Organizations.tsx to use hooks from @/hooks/tags directly
- [x] Update useEntityFeed.ts to use hooks from @/hooks/tags
- [x] Clean up hooks/index.ts exports with clear deprecation messages
- [x] Document all completed migrations
- [x] Update TagForm.tsx to use types from @/utils/tags/types

## Phase 6: Removal (In Progress - Early Implementation)

- [x] Remove src/hooks/tag/* (entire directory) - Early removal
- [x] Remove src/utils/tagUtils.ts - Early removal
- [x] Remove src/hooks/useTagFilter.ts - Early removal
- [x] Remove src/hooks/useTagQueries.ts - Early removal
- [x] Remove src/hooks/useTagMutations.ts - Early removal 
- [x] Remove src/hooks/useTags.ts - Early removal
- [ ] Remove legacy exports from hooks/index.ts (scheduled for Q4 2025)

- [x] Verify all import paths are updated across the codebase:
  - [x] Systematically verified all imports from deprecated files
  - [x] Verified each component works with new import structure
  - [x] Run comprehensive test suite before and after removal

## Component Inventory with Import Analysis

### Pages with Updated Imports

1. **src/pages/AdminTags.tsx**
   - Status: ✅ Fixed
   - Using: `import { useSelectionTags, useTagCrudMutations } from "@/hooks/tags";`

2. **src/pages/CommunityDirectory.tsx**
   - Status: ✅ Fixed
   - Using: `import { useSelectionTags, useFilterTags } from "@/hooks/tags";`

3. **src/pages/Organizations.tsx**
   - Status: ✅ Fixed
   - Using: `import { useSelectionTags, useFilterTags } from "@/hooks/tags";`

### Components with Updated Imports

1. **src/components/entities/EntityFeed.tsx**
   - Status: ✅ Fixed
   - Using: `import { useFilterTags } from "@/hooks/tags";`

2. **src/components/tags/EntityTagManager.tsx**
   - Status: ✅ Fixed
   - Using: `import { useEntityTags, useTagAssignmentMutations } from "@/hooks/tags";`

3. **src/hooks/useEntityFeed.ts**
   - Status: ✅ Fixed
   - Using: `import { useFilterTags, useSelectionTags } from "@/hooks/tags";`

4. **src/components/admin/tags/TagForm.tsx**
   - Status: ✅ Fixed
   - Using: `import { ENTITY_TYPE_MAP } from "@/utils/tags/types";`

### Legacy Files Removed in Current Cleanup

1. **src/hooks/useTagFilter.ts**
   - Status: ✅ Removed
   - All imports redirected to `@/hooks/tags`

2. **src/hooks/useTagQueries.ts**
   - Status: ✅ Removed
   - All imports redirected to `@/hooks/tags`

3. **src/hooks/useTagMutations.ts**
   - Status: ✅ Removed
   - All imports redirected to `@/hooks/tags`

4. **src/hooks/useTags.ts**
   - Status: ✅ Removed
   - All imports redirected to `@/hooks/tags`

5. **src/utils/tagUtils.ts**
   - Status: ✅ Removed
   - All imports redirected to `@/utils/tags`

6. **src/hooks/tag/** (entire directory)
   - Status: ✅ Removed
   - All functionality moved to `hooks/tags/*`

## Migration Timeline for Deprecation Removal

- **Q2 2025:** Ensure all component migrations to new import structure are complete ✅
- **Q3 2025:** Emit more visible console warnings for deprecated imports
- **Q4 2025:** Remove all deprecated re-exports from hooks/index.ts

## Next Steps

1. Keep `useTags` export in hooks/index.ts until Q4 2025 for backward compatibility
2. Add more visible console warnings in Q3 2025
3. Prepare for complete removal of deprecated re-exports in Q4 2025
4. Document the migration path for any external consumers of these APIs

## Technical Debt Resolved

This consolidation has resolved several instances of technical debt:
1. ✅ Eliminated duplicate implementations across multiple files
2. ✅ Standardized the approach to exporting and importing hooks
3. ✅ Improved code organization with a more logical file structure
4. ✅ Added clear deprecation notices and migration paths
5. ✅ Separated concerns by function (CRUD, queries, assignments)
6. ✅ Removed complex adapter layers in favor of direct usage
7. ✅ Removed deprecated files that were only acting as redirections
