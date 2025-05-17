
# Modular Structure Migration Plan

This document outlines the plan for migrating the codebase from a monolithic structure to a more modular organization. The migration will be done in phases to minimize disruption.

## Current Status

Phase 5 of the migration is in progress. The codebase now has:

1. New modular structure fully in place
2. Legacy files properly marked with deprecation notices 
3. Runtime console warnings for deprecated imports
4. Clean redirection from legacy files to their modular counterparts
5. Streamlined factory pattern implementation
6. Tag-related hooks consolidated in `hooks/tags`
7. All components updated to use the consolidated hook structure

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

## Phase 6: Removal (Scheduled for Q4 2025)

- [ ] Remove all files marked with `@deprecated` in next major version:
  - [ ] src/hooks/useTagFilter.ts
  - [ ] src/hooks/useTagQueries.ts
  - [ ] src/hooks/useTagMutations.ts
  - [ ] src/hooks/useTags.ts
  - [ ] src/hooks/tag/* (entire directory)
  - [ ] src/utils/tagUtils.ts
  - [ ] Remove legacy exports from hooks/index.ts

- [ ] Update all import paths across the codebase:
  - [ ] Systematically find all imports from deprecated files
  - [ ] Verify each component works with new import structure
  - [ ] Run comprehensive test suite before and after removal

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

### Legacy Files to be Removed in Q4 2025

1. **src/hooks/useTagFilter.ts**
   - Status: ✅ Properly redirects to `@/hooks/tags`
   - Console warning added for deprecated usage

2. **src/hooks/useTagQueries.ts**
   - Status: ✅ Properly redirects to `@/hooks/tags`
   - Console warning added for deprecated usage

3. **src/hooks/useTagMutations.ts**
   - Status: ✅ Properly redirects to `@/hooks/tags`
   - Console warning added for deprecated usage

4. **src/hooks/useTags.ts**
   - Status: ✅ Properly redirects to `@/hooks/tags`
   - Console warning added for deprecated usage

5. **src/utils/tagUtils.ts**
   - Status: ✅ Properly redirects to `@/utils/tags`
   - Console warning added for deprecated usage

6. **src/hooks/tag/** (entire directory)
   - Status: ✅ All functionality moved to `hooks/tags/*`

## Migration Timeline for Deprecation Removal

- **Q2 2025:** Ensure all component migrations to new import structure are complete ✅
- **Q3 2025:** Emit more visible console warnings for deprecated imports
- **Q4 2025:** Remove all deprecated files in major version update

## Next Steps

1. Evaluate any remaining imports from deprecated files in the codebase
2. Add more visible console warnings in Q3 2025
3. Prepare for complete removal of deprecated files in Q4 2025
4. Document the migration path for any external consumers of these APIs
5. Run comprehensive test suite to ensure no functionality is broken

## Technical Debt Resolved

This consolidation has resolved several instances of technical debt:
1. ✅ Eliminated duplicate implementations across multiple files
2. ✅ Standardized the approach to exporting and importing hooks
3. ✅ Improved code organization with a more logical file structure
4. ✅ Added clear deprecation notices and migration paths
5. ✅ Separated concerns by function (CRUD, queries, assignments)
6. ✅ Removed complex adapter layers in favor of direct usage
