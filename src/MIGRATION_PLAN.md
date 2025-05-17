
# Modular Structure Migration Plan

This document outlines the plan for migrating the codebase from a monolithic structure to a more modular organization. The migration will be done in phases to minimize disruption.

## Current Status

Phase 4 of the migration is in progress. The codebase now has:

1. New modular structure fully in place
2. Legacy files properly marked with deprecation notices
3. Runtime console warnings for deprecated imports
4. Clean redirection from legacy files to their modular counterparts
5. Streamlined factory pattern implementation

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

## Phase 4: Removal (In Progress)

- [ ] Remove remaining ambiguous exports
- [ ] Fix import path inconsistencies
- [ ] Update remaining code to use only the modular imports
- [ ] Prepare for removal of deprecated files in next major version

## Detailed Inventory of Components Still Using Deprecated Imports

### Pages

1. **src/pages/AdminTags.tsx**
   - Currently using: `import { useSelectionTags } from "@/hooks/useTagQueries";`
   - Should migrate to: `import { useSelectionTags } from "@/hooks/tags";`
   - Currently using: `import { useTagCrudMutations } from "@/hooks/tag";`
   - Should migrate to: `import { useTagCrudMutations } from "@/hooks/tags";` (consolidate to one module)

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

### Re-export Files That Should Be Updated or Removed

1. **src/hooks/index.ts**
   - Contains ambiguous exports that should be removed
   - Should use direct imports from specific modules

2. **src/hooks/useTagMutations.ts**
   - Re-exporting from `./tag`
   - Should be removed after all imports are updated

3. **src/hooks/useTags.ts**
   - Re-exporting from `./tags` and `./tag`
   - Should be removed after all imports are updated

4. **src/hooks/useOrganizationQueries.ts**
   - Re-exporting from `./organizations`
   - Should be removed after all imports are updated

5. **src/hooks/useOrganizationAdmins.ts**
   - Re-exporting from `./organizations`
   - Should be removed after all imports are updated

6. **src/hooks/useProfiles.ts**
   - Re-exporting from `./profiles`
   - Should be removed after all imports are updated

7. **src/hooks/useLocations.ts**
   - Re-exporting from `./locations`
   - Should be removed after all imports are updated

8. **src/hooks/useCommunityProfiles.ts**
   - Re-exporting from `./profiles/useCommunityProfiles`
   - Should be reviewed for correct implementation

9. **src/hooks/tag/index.ts**
   - Has inconsistency between its exports and imports in other files
   - Exports should be consolidated with `src/hooks/tags/index.ts`

10. **src/utils/tagUtils.ts**
    - Re-exporting from `./tags`
    - Should be removed after all imports are updated

## Hooks Consolidation Strategy

The primary issue is the split between `hooks/tag` and `hooks/tags` directories:

1. **Current State:**
   - `hooks/tag/` contains mutation hooks for tags
   - `hooks/tags/` contains query hooks for tags
   
2. **Consolidation Plan:**
   - Move all tag-related hooks to `hooks/tags/`
   - Update `hooks/tags/index.ts` to re-export everything
   - Update imports in all components to use `@/hooks/tags`
   - Mark `hooks/tag/` as deprecated with redirection to `hooks/tags`

## Migration Priority Order

1. Fix the inconsistent import in AdminTags.tsx
2. Consolidate tag and tags directories
3. Remove ambiguous exports from hooks/index.ts
4. Update imports in all remaining components
5. Clean up legacy re-export files

## Guidelines for New Code

1. Always import from specific modules directly:
   ```typescript
   // Good
   import { useCurrentProfile } from '@/hooks/profiles';
   
   // Bad
   import { useProfiles } from '@/hooks';
   ```

2. Create functionality in the appropriate module:
   ```
   /api/{domain}/     # For API functionality
   /hooks/{domain}/   # For React hooks
   /utils/{domain}/   # For utility functions
   ```

3. Export from the module's index.ts file:
   ```typescript
   // src/hooks/profiles/index.ts
   export { useProfileList, useProfileById } from './useProfileHooks';
   ```

4. Use the factory pattern for consistent API and hooks:
   ```typescript
   // API
   import { createApiFactory } from '@/api/core/factory'; 
   const entityApi = createApiFactory<EntityType>({ /* config */ });
   
   // Hooks
   import { createQueryHooks } from '@/hooks/core/factory';
   const entityHooks = createQueryHooks(entityConfig, entityApi);
   ```

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
│   └── index.ts          # Re-exports (to be removed after migration)
└── utils/                # Utility functions
    ├── {domain}/         # Domain-specific utilities
    └── index.ts          # Re-exports (to be removed after migration)
```

## Benefits of the New Structure

1. **Better Code Organization**: Related code is grouped together by domain
2. **Improved Maintainability**: Smaller, more focused modules are easier to understand and update
3. **Enhanced Developer Experience**: Direct imports make dependencies clear
4. **Reduced Bundle Size**: Tree-shaking works better with direct imports
5. **Easier Testing**: Isolated modules are easier to test
