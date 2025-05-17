
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

## Phase 2: Error Handling Unification ✓

**Goal**: Create a unified error handling system across the application.

**Tasks**:
- [x] Move all error handling utilities to a single location
- [x] Remove deprecated `formatRepositoryError` from `errorUtils.ts`
- [x] Create a unified error handling API that works across all contexts
- [x] Update components to use the new error handling system
- [x] Standardize error logging patterns

**Benefits**:
- Consistent error handling across the application
- Improved error messages for users
- Better debugging capabilities
- Simplified error handling code

## Phase 3: Legacy API Clean-up ✓

**Goal**: Remove deprecated API files and update imports.

**Tasks**:
- [x] Update any remaining imports from legacy API files
- [x] Remove all deprecated API files including:
  - [x] `src/api/organizationsApi.ts` (replaced with forwarding module)
  - [x] `src/api/core/apiFactory.ts` (replaced with forwarding module)
- [x] Ensure all API access uses the current factory pattern
- [x] Fix type errors in batch operations factory

**Benefits**:
- Smaller codebase
- Clearer API surface
- Improved maintainability
- Consistent API usage patterns

## Phase 4: Hook Import Standardization (Completed) ✓

**Goal**: Standardize all hook imports to use the modular structure.

**Tasks**:
- [x] Fix type errors in organization mutation hooks 
- [x] Add missing relationship hooks export in organization hooks module
- [x] Update backward compatibility layers for organization hooks
- [x] Set up consistent deprecation warnings across hook modules
- [x] Update remaining components using legacy hooks like `useOrganizationAdmins.ts`
- [x] Ensure all imports use the modular structure (e.g., from `@/hooks/organizations`)
- [x] Remove remaining legacy hook files after updates
- [x] Update test files to use the new import patterns
- [x] Create a central export for hook factory functions

**Benefits**:
- Consistent import patterns
- Better code organization
- Improved discoverability of hooks
- Smaller bundle sizes through tree-shaking

## Phase 5: Repository Pattern Enhancement (Completed) ✓

**Goal**: Enhance the repository pattern for data access.

**Tasks**:
- [x] Ensure consistent use of the repository factory pattern
- [x] Consolidate repository utilities
- [x] Create documentation for the repository pattern
- [x] Standardize error handling in repositories
- [x] Improve typing of repository interfaces
- [x] Create enhanced repository factory with advanced options
- [x] Implement standard repository operations
- [x] Provide integration examples

**Benefits**:
- More consistent data access patterns
- Better testability of data access code
- Improved error handling for API calls
- Clearer separation of concerns
- Enhanced developer experience with better documentation
- Reduced code duplication in repository implementations
