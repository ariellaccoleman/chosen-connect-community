

# Modular Structure Migration Plan

This document outlines the plan for migrating the codebase from a monolithic structure to a more modular organization.

## Current Status

Phase 4 in progress! The codebase now has:

1. New modular structure fully in place
2. All components updated to use the consolidated hook structure
3. Unified error handling system implemented
4. Toast system consolidated
5. Legacy API files removed or replaced with clean forwarding modules

## Phase 1: Deprecation Notices (Completed) ✓

- [x] Mark legacy files with `@deprecated` JSDoc tags
- [x] Add documentation for preferred import patterns
- [x] Create migration plan document
- [x] Add README files to document module structure

## Phase 2: Deprecation Warnings (Completed) ✓

- [x] Add runtime console warnings in development mode for deprecated imports
- [x] Document preferred import paths
- [x] Create clean redirection files for backward compatibility

## Phase 3: Legacy API Clean-up (Completed) ✓

**Goal**: Remove deprecated API files and update imports.

**Tasks**:
- [x] Update any remaining imports from legacy API files
- [x] Deprecate older API files including:
  - [x] `src/api/organizationsApi.ts`
  - [x] `src/api/core/apiFactory.ts`
- [x] Fix TypeScript errors in repository pattern implementation

**Benefits**:
- Smaller codebase
- Clearer API surface
- Improved maintainability
- Consistent API usage patterns

## Phase 4: Hook Import Standardization (In Progress)

**Goal**: Standardize all hook imports to use the modular structure.

**Tasks**:
- [x] Fix errors in legacy hook compatibility layers
- [x] Update relationship mutations to use proper API functions
- [x] Fix type errors in RepositoryQuery interfaces
- [ ] Update components using legacy hooks like `useOrganizationAdmins.ts`
- [ ] Ensure all imports use the modular structure (e.g., from `@/hooks/organizations`)
- [ ] Remove remaining legacy hook files after updates
- [ ] Update test files to use the new import patterns

**Benefits**:
- Consistent import patterns
- Better code organization
- Improved discoverability of hooks
- Smaller bundle sizes through tree-shaking

## Phase 5: Repository Pattern Enhancement (Not Started)

**Goal**: Enhance the repository pattern for data access.

**Tasks**:
- [ ] Ensure consistent use of the repository factory pattern
- [ ] Consolidate repository utilities
- [ ] Create documentation for the repository pattern
- [ ] Standardize error handling in repositories
- [ ] Improve typing of repository interfaces

**Benefits**:
- More consistent data access patterns
- Better testability of data access code
- Improved error handling for API calls
- Clearer separation of concerns

