
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

## Phase 4: Tag Consolidation (Completed)

- [x] Fixed inconsistent imports in AdminTags.tsx
- [x] Consolidated tag and tags directories
- [x] Created clean redirections for all tag-related hooks
- [x] Organized tag hooks into logical groups (CRUD, queries, assignments)

## Phase 5: Removal (In Progress)

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

2. **src/pages/CommunityDirectory.tsx**
   - Currently using: `import { useCurrentProfile } from "@/hooks/profiles";`
   - This is the correct path, but implementation might need review
   - Currently using: `import { useCommunityProfiles } from "@/hooks/profiles";`
   - This is the correct path, but implementation needs parameter fixes

3. **src/pages/ProfileEdit.tsx**
   - Currently using: `import { useCurrentProfile, useUpdateProfile } from "@/hooks/profiles";`
   - This is the correct path
   - Currently using: `import { useAddOrganizationRelationship } from "@/hooks/organizations";`
   - This is the correct path, migration complete

4. **src/pages/OrganizationEdit.tsx**
   - Currently using: `import { useIsOrganizationAdmin, useOrganization } from "@/hooks/organizations";`
   - This is the correct path, migration complete

### Components

1. **src/components/organizations/edit/OrganizationEditForm.tsx**
   - Currently using: `import { useUpdateOrganization } from "@/hooks/organizations";`
   - This is the correct path, migration complete

2. **src/components/organizations/OrganizationAdmins.tsx**
   - Currently using: `import { useOrganizationAdminsByOrg, usePendingOrganizationAdmins, useOrganizationRole } from "@/hooks/organizations";`
   - This is the correct path, migration complete

3. **src/components/profile/form/LocationSelector.tsx**
   - Currently using: `import { useLocationSearch, useLocationById } from "@/hooks/locations";`
   - This is the correct path, migration complete

### Re-export Files Updated or Consolidated

1. **src/hooks/useTagQueries.ts**
   - Now properly re-exporting from `./tags/useTagQueryHooks`
   - Includes deprecation warning in development

2. **src/hooks/useTagMutations.ts**
   - Now properly re-exporting from `./tags`
   - Includes deprecation warning in development

3. **src/hooks/useTags.ts**
   - Now properly re-exporting from `./tags`
   - Includes deprecation warning in development

4. **src/hooks/tag/index.ts**
   - Will be removed in next phase after all imports are updated to use hooks/tags

### Remaining Re-export Files To Clean Up

1. **src/hooks/index.ts**
   - Contains ambiguous exports that should be removed
   - Should use direct imports from specific modules

2. **src/hooks/useOrganizationQueries.ts**
   - Re-exporting from `./organizations`
   - Should be removed after all imports are updated

3. **src/hooks/useOrganizationAdmins.ts**
   - Re-exporting from `./organizations`
   - Should be removed after all imports are updated

4. **src/hooks/useProfiles.ts**
   - Re-exporting from `./profiles`
   - Should be removed after all imports are updated

5. **src/hooks/useLocations.ts**
   - Re-exporting from `./locations`
   - Should be removed after all imports are updated

6. **src/hooks/useCommunityProfiles.ts**
   - Re-exporting from `./profiles/useCommunityProfiles`
   - Should be reviewed for correct implementation

7. **src/utils/tagUtils.ts**
    - Re-exporting from `./tags`
    - Should be removed after all imports are updated

## Next Steps

1. Continue fixing imports in components to use the consolidated modules directly
2. Remove ambiguous exports from hooks/index.ts
3. Clean up remaining legacy re-export files
4. Update documentation to reflect the new structure

## Benefits of the Consolidated Structure

1. **Simplified Imports**: Instead of having to remember whether to import from `hooks/tag` or `hooks/tags`, developers can now import everything from `hooks/tags`
2. **Reduced Duplication**: All tag-related functionality is now in one place
3. **Better Organized**: Hooks are now grouped by function (CRUD, queries, assignments)
4. **Clearer Deprecation Path**: Legacy files now clearly indicate their replacements

## Timeline for Deprecation Removal

- **Q2 2025:** Finish all component migrations to new import structure
- **Q3 2025:** Start emitting console warnings for deprecated imports
- **Q4 2025:** Release major version update that removes deprecated files

## Modular Directory Structure

```
src/
├── api/                  # API modules
│   ├── core/             # Core API functionality
│   │   ├── factory/      # API factory pattern implementation
│   │   └── repository/   # Data repository implementations
│   ├── {domain}/         # Domain-specific API (e.g., profiles, organizations)
│   └── index.ts          # Re-exports (to be removed after migration)
├── hooks/                # React hooks
│   ├── core/             # Core hook utilities
│   │   └── factory/      # Query hook factory pattern implementation
│   ├── {domain}/         # Domain-specific hooks
│   │   ├── index.ts      # Domain exports
│   │   └── use{Domain}Hooks.ts # Domain-specific hooks implementation
│   └── index.ts          # Re-exports (to be removed after migration)
└── utils/                # Utility functions
    ├── {domain}/         # Domain-specific utilities
    └── index.ts          # Re-exports (to be removed after migration)
```
