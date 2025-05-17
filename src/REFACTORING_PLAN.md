
# Codebase Refactoring Plan

This document outlines the plan for refactoring the codebase to reduce surface area, increase reusability, and improve maintainability.

## Phase 1: Toast System Consolidation ✓

**Goal**: Simplify the toast notification system by standardizing on a single implementation.

**Tasks**:
- [x] Standardize on Sonner toast as the primary toast system
- [x] Remove the dual toast implementation in `src/hooks/use-toast.ts`
- [x] Create a clean API for showing toast notifications
- [x] Update components to use the consolidated toast system
- [x] Remove redundant toast components from the application providers

**Benefits**:
- Simplified API for displaying notifications
- Reduced bundle size
- Consistent user experience
- Less code to maintain

## Phase 2: Error Handling Unification

**Goal**: Create a unified error handling system across the application.

**Tasks**:
- [ ] Move all error handling utilities to a single location
- [ ] Remove deprecated `formatRepositoryError` from `errorUtils.ts`
- [ ] Create a unified error handling API that works across all contexts
- [ ] Update components to use the new error handling system
- [ ] Standardize error logging patterns

**Benefits**:
- Consistent error handling across the application
- Improved error messages for users
- Better debugging capabilities
- Simplified error handling code

## Phase 3: Legacy API Clean-up

**Goal**: Remove deprecated API files and update imports.

**Tasks**:
- [ ] Update any remaining imports from legacy API files
- [ ] Remove all deprecated API files including:
  - [ ] `src/api/organizationsApi.ts`
  - [ ] `src/api/core/apiFactory.ts`
  - [ ] Other files with `@deprecated` tags
- [ ] Ensure all API access uses the current factory pattern

**Benefits**:
- Smaller codebase
- Clearer API surface
- Improved maintainability
- Consistent API usage patterns

## Phase 4: Hook Import Standardization

**Goal**: Standardize all hook imports to use the modular structure.

**Tasks**:
- [ ] Update components using legacy hooks like `useOrganizationAdmins.ts`
- [ ] Ensure all imports use the modular structure (e.g., from `@/hooks/organizations`)
- [ ] Remove remaining legacy hook files after updates
- [ ] Update test files to use the new import patterns

**Benefits**:
- Consistent import patterns
- Better code organization
- Improved discoverability of hooks
- Smaller bundle sizes through tree-shaking

## Phase 5: Repository Pattern Enhancement

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
