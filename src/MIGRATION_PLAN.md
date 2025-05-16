
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

