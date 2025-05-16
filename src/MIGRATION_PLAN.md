
# Modular Structure Migration Plan

This document outlines the plan for migrating the codebase from a monolithic structure to a more modular organization. The migration will be done in phases to minimize disruption.

## Current Status

The codebase is currently in a transitional state with:

1. New modular structure in place for most modules
2. Legacy re-export files with deprecation warnings for backward compatibility
3. Clear documentation on preferred import patterns

## Phase 1: Deprecation Notices (Current)

- [x] Mark legacy files with `@deprecated` JSDoc tags
- [x] Add documentation for preferred import patterns
- [x] Create migration plan document
- [x] Add README files to document module structure

## Phase 2: Deprecation Warnings (Next Major Version)

- [ ] Add runtime console warnings in development mode for deprecated imports
- [ ] Update ESLint rules to warn about deprecated import patterns
- [ ] Provide automated migration script to update imports

## Phase 3: Removal (Subsequent Major Version)

- [ ] Remove all deprecated re-export files
- [ ] Update documentation to reflect the new structure only
- [ ] Complete any necessary refactoring of remaining code

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
   const entityApi = createApiFactory<EntityType>({ /* config */ });
   
   // Hooks
   const entityHooks = createQueryHooks(entityConfig, entityApi);
   ```

## Modular Directory Structure

```
src/
├── api/                  # API modules
│   ├── core/             # Core API functionality
│   ├── {domain}/         # Domain-specific API (e.g., profiles, organizations)
│   └── index.ts          # Re-exports (to be removed after migration)
├── hooks/                # React hooks
│   ├── core/             # Core hook utilities
│   ├── {domain}/         # Domain-specific hooks
│   └── index.ts          # Re-exports (to be removed after migration)
└── utils/                # Utility functions
    ├── {domain}/         # Domain-specific utilities
    └── index.ts          # Re-exports (to be removed after migration)
```
