
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

## Detailed Inventory of Components Using Deprecated Imports

### Pages

1. **src/pages/AdminTags.tsx**
   - Currently using: `import { useSelectionTags as useTags, useTagMutations } from "@/hooks/useTags";`
   - Should migrate to: `import { useSelectionTags, useTagCrudMutations } from "@/hooks/tags";`

2. **src/pages/CommunityDirectory.tsx**
   - Currently using: `import { useProfiles } from "@/hooks/useProfiles";`
   - Should migrate to: `import { useCurrentProfile } from "@/hooks/profiles";`
   - Also using: `import { useCommunityProfiles } from "@/hooks/useCommunityProfiles";`
   - Should migrate to: `import { useCommunityProfiles } from "@/hooks/profiles";` (needs to be created)

3. **src/pages/ProfileEdit.tsx**
   - Currently using: `import { useAddOrganizationRelationship } from "@/hooks/useOrganizations";`
   - Should migrate to: `import { useAddOrganizationRelationship } from "@/hooks/organizations";`

4. **src/pages/OrganizationEdit.tsx**
   - Currently using: `import { useIsOrganizationAdmin } from "@/hooks/useOrganizationAdmins";`
   - Should migrate to: `import { useIsOrganizationAdmin } from "@/hooks/organizations";`
   - Currently using: `import { useOrganization } from "@/hooks/useOrganizationQueries";`
   - Should migrate to: `import { useOrganization } from "@/hooks/organizations";`

### Components

1. **src/components/organizations/edit/OrganizationEditForm.tsx**
   - Currently using: `import { useUpdateOrganization } from "@/hooks/useOrganizationMutations";`
   - Should migrate to: `import { useUpdateOrganization } from "@/hooks/organizations";`

2. **src/components/organizations/OrganizationAdmins.tsx**
   - Currently using: `import { useOrganizationAdminsByOrg, usePendingOrganizationAdmins, useOrganizationRole } from "@/hooks/useOrganizationAdmins";`
   - Should migrate to: `import { useOrganizationAdminsByOrg, usePendingOrganizationAdmins, useOrganizationRole } from "@/hooks/organizations";`

3. **src/components/profile/form/LocationSelector.tsx**
   - Currently using: `import { useLocations } from "@/hooks/useLocations";`
   - Should migrate to: `import { useLocationSearch } from "@/hooks/locations";`
   - Currently using: `import { useLocationById } from "@/hooks/useLocationById";`
   - Should migrate to: `import { useLocationById } from "@/hooks/locations";`

4. **src/components/profile/ProfileOrganizationLinks.tsx**
   - Currently using: `import { useOrganizations, useUserOrganizationRelationships } from "@/hooks/organizations";`
   - Already using the new modular imports, but implementation might need updating

5. **src/hooks/index.ts** (Re-export file)
   - Currently using ambiguous exports that should be resolved to direct imports from modules

6. **src/hooks/tags/index.ts**
   - Has incorrect export referencing `useTagCrudMutations` which should be fixed

### Circular Dependencies

1. **src/hooks/useOrganizationMutations.ts**
   - Has circular imports between organization hooks that need to be resolved

### Missing Implementations

1. **useCommunityProfiles hook**
   - Should be created in `/hooks/profiles` module and exported correctly

## Migration Priority Order

1. Fix circular dependencies in hooks
2. Create missing hook implementations
3. Fix re-export files
4. Update page component imports
5. Update regular component imports

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
