
# Test Fix Plan: Resolving Authentication and Client Instantiation Issues

## Executive Summary

The current test failures are primarily caused by **authentication timing issues** where API clients and repositories are instantiated before test users are properly authenticated. This leads to RLS violations and authentication errors across multiple test suites.

## Root Cause Analysis

### 1. Static Import Problem
- **Issue**: 72+ files statically import `apiClient` from `src/api/core/apiClient.ts`
- **Impact**: API clients are instantiated during module loading, before test authentication
- **Result**: Tests use unauthenticated clients, causing RLS violations

### 2. Factory Instantiation Timing
- **Issue**: API factories create clients immediately when called
- **Impact**: Clients are created with default (unauthenticated) context
- **Result**: Subsequent operations fail authentication checks

### 3. Multiple Client Instances
- **Issue**: Production client and test clients coexist, causing confusion
- **Impact**: Tests may use wrong client instance
- **Result**: Inconsistent authentication state

### 4. Test Isolation Problems
- **Issue**: Poor cleanup between tests leads to data contamination
- **Impact**: Tests interfere with each other
- **Result**: Flaky test results and constraint violations

## Recommended Solutions

### Phase 1: Eliminate Static API Client Imports (Priority: HIGH)

#### 1.1 Refactor API Factory Pattern
**Current Problem:**
```typescript
// BAD: Static import creates client immediately
import { apiClient } from '@/api/core/apiClient';

export const tagApi = createTagApi(apiClient);
```

**Proposed Solution:**
```typescript
// GOOD: Lazy factory pattern
export const createTagApiWithClient = (client?: any) => {
  return createTagApi(client);
};

// Usage in components
const MyComponent = () => {
  const tagApi = useMemo(() => createTagApiWithClient(), []);
  // ...
};
```

#### 1.2 Create Authentication-Aware Hooks
**Files to Create:**
- `src/hooks/api/useTagApi.ts`
- `src/hooks/api/useOrganizationApi.ts`
- `src/hooks/api/usePersonApi.ts`

**Pattern:**
```typescript
export const useTagApi = (testClient?: any) => {
  return useMemo(() => {
    return createExtendedTagApi(testClient);
  }, [testClient]);
};
```

### Phase 2: Fix Test Authentication Flow (Priority: HIGH)

#### 2.1 Implement Authentication-First Test Pattern
**Current Issue:**
```typescript
// BAD: API created before authentication
const tagApi = createExtendedTagApi(authenticatedClient);
const authResult = await TestAuthUtils.setupTestAuth('user5');
```

**Proposed Fix:**
```typescript
// GOOD: Authentication first, then API creation
const authResult = await TestAuthUtils.setupTestAuth('user5');
const tagApi = createExtendedTagApi(authResult.client);
```

#### 2.2 Update Test Structure
**Apply to all test files:**
1. Authenticate BEFORE creating any API instances
2. Pass authenticated client to all factory functions
3. Verify session state before operations

### Phase 3: Improve Test Isolation (Priority: MEDIUM)

#### 3.1 Enhanced Cleanup Strategy
- Implement transaction-based test isolation
- Add foreign key constraint awareness to cleanup
- Improve user-scoped cleanup methods

#### 3.2 Better Error Handling
- Add retry logic for authentication failures
- Implement proper timeout handling
- Add debugging information for failed tests

### Phase 4: Production Safety (Priority: MEDIUM)

#### 4.1 Maintain Backward Compatibility
- Keep existing API exports for production use
- Add deprecation warnings for problematic patterns
- Provide migration guide for consuming components

#### 4.2 Environment Detection
- Improve test environment detection
- Ensure production code paths remain unchanged
- Add runtime validation for client consistency

## Implementation Priority

### Immediate (Next Sprint)
1. **Fix authentication timing in test files** (2-3 days)
   - Update `tests/api/tags/tagsApi.integration.test.ts`
   - Update `tests/api/organizations/organizationsApi.integration.test.ts`
   - Update `tests/api/persons/personsApi.integration.test.ts`

2. **Create authentication-aware hooks** (1-2 days)
   - Replace static imports in high-usage components
   - Create lazy-loading API hooks

### Short Term (Current Sprint)
3. **Refactor factory patterns** (3-4 days)
   - Update all API factories to support optional client parameter
   - Eliminate static client instantiation

4. **Improve test isolation** (2-3 days)
   - Enhanced cleanup methods
   - Transaction-based testing

### Medium Term (Next Sprint)
5. **Component migration** (5-7 days)
   - Migrate components away from static API imports
   - Update hook usage patterns

6. **Documentation and guides** (1-2 days)
   - Create migration documentation
   - Update testing best practices

## Risk Assessment

### High Risk
- **Breaking Changes**: Modifying API factory signatures
- **Production Impact**: Changes to core API client behavior

### Medium Risk
- **Test Stability**: During transition period, some tests may be flaky
- **Development Velocity**: Temporary slowdown during refactoring

### Low Risk
- **Performance**: Minimal impact on production performance
- **User Experience**: No user-facing changes

## Success Metrics

### Immediate Success
- [ ] All tag API integration tests pass consistently
- [ ] No authentication timing issues in test runs
- [ ] Clean test isolation without data contamination

### Long-term Success
- [ ] Zero static imports of `apiClient` in component files
- [ ] All API access goes through authentication-aware hooks
- [ ] Test suite runs reliably in CI/CD without flaky failures
- [ ] Clear separation between production and test client management

## Technical Debt Reduction

This plan addresses several technical debt items:
1. **Implicit Dependencies**: Making authentication requirements explicit
2. **Test Reliability**: Eliminating flaky tests due to timing issues
3. **Code Organization**: Better separation of concerns between API and auth
4. **Maintainability**: Clearer patterns for API client management

## Next Steps

1. **Review and Approve Plan**: Team review of this document
2. **Create Implementation Tasks**: Break down into specific JIRA tickets
3. **Begin Phase 1**: Start with authentication timing fixes
4. **Iterative Testing**: Validate each phase before proceeding
5. **Documentation Updates**: Keep documentation current throughout

---

**Document Version**: 1.0  
**Last Updated**: {{ current_date }}  
**Owner**: Development Team  
**Reviewers**: Technical Lead, QA Lead
