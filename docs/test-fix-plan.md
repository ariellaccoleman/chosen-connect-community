
# Comprehensive Reset Function Implementation Plan

## Executive Summary

This plan outlines the implementation of standardized `resetApi` functions across all API factories and repository creation patterns in the codebase. This will enable proper authentication timing in tests by allowing API instances to be recreated with authenticated clients after test user setup.

## Root Cause Analysis

### 1. Static Import Problem
- **Issue**: 72+ files statically import API clients during module loading
- **Impact**: API clients are instantiated before test authentication
- **Result**: Tests use unauthenticated clients, causing RLS violations

### 2. Factory Instantiation Timing
- **Issue**: API factories create clients immediately when called
- **Impact**: Clients are created with default (unauthenticated) context
- **Result**: Subsequent operations fail authentication checks

### 3. Inconsistent Reset Patterns
- **Issue**: No standardized way to recreate APIs with authenticated clients
- **Impact**: Tests cannot easily switch to authenticated API instances
- **Result**: Authentication timing issues persist

## Comprehensive Reset Function Implementation Plan

### 1. **Standardize Reset Function Names**
All reset functions should be named `resetApi` for consistency across all factories.

### 2. **Core Factory Functions to Update**

#### **A. API Factories (`createApiFactory`)**
- **Files to modify:**
  - `src/api/profiles/profileApiFactory.ts`
  - `src/api/organizations/organizationApiFactory.ts` 
  - `src/api/events/eventApiFactory.ts`
  - `src/api/hubs/hubApiFactory.ts`
  - `src/api/locations/locationsApi.ts`
  - `src/api/chat/chatChannelsApi.ts`
  - `src/api/chat/chatMessageApiFactory.ts`

- **Implementation:** Add `resetApi(client)` function that recreates the API factory with the provided authenticated client, returning the same export structure as the original factory.

#### **B. View Factories (`createViewApiFactory`)**
- **Files to check:** Any files using `createViewApiFactory` or `createViewRepositoryInstance`
- **Implementation:** Add `resetApi(client)` function that recreates view operations with authenticated client for read-only operations.

#### **C. Complex Tag Factory Structure**
- **File:** `src/api/tags/factory/tagApiFactory.ts`
- **Challenge:** This file has multiple factory functions:
  - `createTagApi` and `createExtendedTagApi`
  - `createTagAssignmentApi` and `createExtendedTagAssignmentApi`
  - `createTagAssignmentRelationshipApi`
- **Implementation:** Single `resetApi(client)` that recreates all tag-related APIs and returns an object matching all current exports.

### 3. **Repository Factory Functions**

#### **A. Core Repository Factory**
- **File:** `src/api/core/repository/repositoryFactory.ts`
- **Functions to update:**
  - `createRepository<T>()` - add client parameter support
  - `createTestingRepository<T>()` - add client parameter support  
  - `createViewRepositoryInstance<T>()` - already has client parameter
  - `createTestingViewRepository<T>()` - already has client parameter

#### **B. Enhanced Repository Factory**
- **File:** `src/api/core/repository/enhancedRepositoryFactory.ts`
- **Update:** Ensure all repository creation methods support client injection

### 4. **Central Reset Utility**

#### **A. Create Central Reset Function**
- **File:** `src/api/core/apiResetUtils.ts`
- **Function:** `resetAllApis(client)` that calls all individual `resetApi` functions
- **Exports:** Individual reset functions for granular control

#### **B. Integration Points**
- **File:** `src/api/core/testing/testAuthUtils.ts` (create if doesn't exist)
- **Integration:** Call `resetAllApis` in `setupTestAuth` after authentication

### 5. **Return Value Consistency**

Each `resetApi` function should return an object that matches the exact same export structure as the original factory:

```typescript
// Original exports
export const { getAll, getById, create, update, delete } = someApi;

// Reset function should return
export const resetApi = (client) => {
  const newApi = createApiFactory(config, client);
  return {
    // Same destructured exports
    getAll: newApi.getAll,
    getById: newApi.getById,
    create: newApi.create,
    update: newApi.update,
    delete: newApi.delete,
    // Plus any additional exports the original had
  };
};
```

### 6. **Special Cases to Handle**

#### **A. Chat Message Service**
- **File:** `src/api/chat/chatMessageService.ts`
- Uses `createRepository('chats')` directly in functions
- **Solution:** Add client parameter to service functions and update to use provided client

#### **B. Files with Multiple Repository Creations**
- Files that call `createRepository` multiple times in different functions
- **Solution:** Ensure all repository creation calls can accept an optional client parameter

#### **C. Hook Factory Integration**
- **File:** `src/hooks/core/factory/viewHookFactory.ts`
- Ensure view hook factories work with reset view operations

### 7. **Implementation Order**

1. **Update core repository factories** to support client injection
2. **Add reset functions to each API factory** one by one
3. **Create central reset utility** that orchestrates all resets
4. **Update service files** that create repositories directly
5. **Integration testing** to ensure all resets work properly

### 8. **Testing Strategy**

- Each `resetApi` function should be testable independently
- Central `resetAllApis` should reset all APIs at once
- Verify that reset APIs work with authenticated clients in test environment
- Ensure no breaking changes to existing functionality

## Implementation Priority

### Phase 1: Core Infrastructure (Priority: HIGH)
1. **Update core repository factories** (1-2 days)
   - Add client parameter support to `createRepository` functions
   - Ensure backward compatibility

2. **Create central reset utility** (1 day)
   - Implement `resetAllApis` function
   - Create individual reset function exports

### Phase 2: API Factory Updates (Priority: HIGH)
3. **Add reset functions to API factories** (2-3 days)
   - Profile, Organization, Event, Hub API factories
   - Chat API factories
   - Complex tag factory structure

4. **Update service files** (1-2 days)
   - Chat message service
   - Other files with direct repository creation

### Phase 3: Integration and Testing (Priority: MEDIUM)
5. **Test integration** (1-2 days)
   - Verify all reset functions work independently
   - Test central reset utility
   - Ensure no breaking changes

6. **Documentation and cleanup** (1 day)
   - Update testing guidelines
   - Remove deprecated patterns

## Success Metrics

### Immediate Success
- [ ] All API factories have standardized `resetApi` functions
- [ ] Central `resetAllApis` utility works correctly
- [ ] No breaking changes to existing functionality
- [ ] All tests can use authenticated API instances

### Long-term Success
- [ ] Zero authentication timing issues in tests
- [ ] Consistent pattern for API reset across codebase
- [ ] Clean separation between production and test API management
- [ ] Reliable test execution without RLS violations

## Risk Assessment

### High Risk
- **Breaking Changes**: Modifying core repository factory signatures
- **Integration Complexity**: Ensuring all reset functions work together

### Medium Risk
- **Test Stability**: During implementation, some tests may be temporarily unstable
- **Backward Compatibility**: Ensuring existing code continues to work

### Low Risk
- **Performance**: Minimal impact on production performance
- **User Experience**: No user-facing changes

## Technical Debt Reduction

This plan addresses several technical debt items:
1. **Inconsistent Patterns**: Standardizing API reset across all factories
2. **Test Reliability**: Eliminating authentication timing issues
3. **Code Organization**: Better separation of concerns between API and auth
4. **Maintainability**: Clearer patterns for API client management

## Next Steps

1. **Review and Approve Plan**: Team review of this document
2. **Create Implementation Tasks**: Break down into specific tickets
3. **Begin Phase 1**: Start with core infrastructure updates
4. **Iterative Implementation**: Validate each phase before proceeding
5. **Testing and Documentation**: Ensure all changes are properly tested and documented

---

**Document Version**: 2.0  
**Last Updated**: 2025-05-29  
**Owner**: Development Team  
**Reviewers**: Technical Lead, QA Lead
