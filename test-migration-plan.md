
# Test Migration Plan: From Mocks to Database Integration

## Executive Summary

This plan outlines the migration of skipped tests from mock-based testing to database integration testing, and the updating of APIs that are not yet using the factory pattern. Based on analysis of the latest test run with 18 test suites, this will provide more reliable testing that matches production behavior.

## Current State Analysis (18 Test Suites)
### Current tests
1. verify-env
   - dynamically generated to verify test environment works
2. tagsApi.integration
   - correctly implemented test
   - api implemented with factory pattern
   - model for other testing
3. relationshipsApi
    - check if api uses relationships factory like tag assignment does
4. relationshipsApi.database
    - determine if needed
5. apiFactory
6. apiFactoryWithRepo
7. authApi
8. batchOperation
9. CreateEvent
10. databaseConnection
11. errorHandler
12. EventTagsManager
13. formUtils
14. organizationsApi
15. queryHookFactory
16. repository
17. testProjectValidation
18. useFormError
19. useOrganizationMutations


### Currently Passing Integration Tests ✅
1. **tests/api/tags/tagsApi.integration.test.ts** - Database integration (user4)
2. **tests/api/organizations/relationshipsApi.database.test.ts** - Database integration (user2)

### Skipped Tests Identified
1. **tests/hooks/useOrganizationMutations.test.tsx** (Factory-based, skipped)
   - Status: Uses factory pattern, but relies on mocks  
   - Migration: Convert to use CentralTestAuthUtils with real database
   - User Assignment: user1 (available)

### Mock-Based Tests Requiring Analysis
From the 18 test suites, the following likely need migration evaluation:



2. **tests/api/authApi.test.ts** (Mock-based)
   - Status: Deprecated mock tests
   - Migration: Already has replacement at integration tests
   - Action: Remove deprecated test file

3. **tests/api/organizations/organizationsApi.test.ts** (Mock-based)
   - Status: Mock-based organization tests
   - Migration: Convert to database integration or remove if superseded
   - User Assignment: user1

4. **tests/api/organizations/relationshipsApi.test.ts** (Mock-based)
   - Status: Mock-based relationship tests  
   - Migration: Remove (superseded by relationshipsApi.database.test.ts)

5. **tests/api/core/repository/repository.test.ts** (Unit test)
   - Status: Repository unit tests
   - Action: Keep as unit tests (testing repository logic, not database)

6. **tests/components/*.test.tsx** (Component tests)
   - Status: React component unit tests
   - Action: Keep as unit tests (UI testing, no database needed)

7. **tests/hooks/core/queryHookFactory.test.tsx** (Hook tests)
   - Status: Hook unit tests with mocks
   - Evaluation: Determine if integration testing needed

### APIs Not Using Factory Pattern

From codebase analysis, the following APIs need factory pattern updates:

1. **authApi.ts** - Authentication API
   - Current: Direct Supabase client usage
   - Needs: Factory pattern with client injection support

2. **locationsApi.ts** - Legacy locations API  
   - Current: Direct Supabase client usage
   - Needs: Factory pattern conversion or deprecation

3. **tags.ts** - Legacy tags API
   - Current: Mixed patterns
   - Needs: Full migration to existing factory-based tag API

## Updated Migration Strategy

### Phase 1: Remove Deprecated Mock Tests (Immediate - 0.5 days)

**Objective**: Clean up test suite by removing superseded mock tests

**Tasks**:
1. Delete `tests/api/authApi.test.ts` (superseded by integration test)
2. Delete `tests/api/organizations/relationshipsApi.test.ts` (superseded by database test)
3. Remove any other identified deprecated mock test files
4. Update test scripts if needed

**Success Criteria**:
- No deprecated mock tests remain in test suite
- All remaining tests either pass or are intentionally skipped for migration

### Phase 2: Convert Factory-Based Mock Tests (1-2 days)

**Objective**: Migrate existing factory-based tests from mocks to database integration

**Tasks**:

#### 2.1 Update useOrganizationMutations Test
- **File**: `tests/hooks/useOrganizationMutations.test.tsx`
- **User**: user1
- **Changes**:
  - Replace mock API responses with `CentralTestAuthUtils.executeWithAuthenticatedAPI`
  - Use real organization factory API with authenticated client
  - Test actual database operations and RLS policies
  - Verify success/error handling with real responses

#### 2.2 Evaluate and Convert Other Hook Tests
- **File**: `tests/hooks/core/queryHookFactory.test.tsx`
- **User**: user3 (available)
- **Decision**: Determine if factory hooks need integration testing
- **Action**: Convert if testing API interactions, keep as unit if testing pure logic

#### 2.3 Convert organizationsApi Mock Tests
- **File**: `tests/api/organizations/organizationsApi.test.ts`
- **User**: user1 
- **Action**: Convert to database integration or remove if duplicated elsewhere

### Phase 3: Convert Non-Factory APIs to Factory Pattern (2-3 days)

**Objective**: Update remaining APIs to use factory pattern for consistency and testability

#### 3.1 authApi.ts Migration
- **Current State**: Direct Supabase client usage in auth operations
- **Target**: Factory pattern with client injection
- **Approach**:
  - Create `authApiFactory.ts` with `resetAuthApi(client?)` function
  - Maintain existing `authApi.ts` as default export for backward compatibility
  - Add client injection support for test scenarios

#### 3.2 locationsApi.ts Assessment
- **Decision Point**: Migrate to factory pattern OR deprecate in favor of existing factory-based location API
- **Recommendation**: Evaluate usage and migrate high-value functionality to factory pattern
- **If deprecated**: Update all consumers to use factory-based location API

#### 3.3 Legacy tags.ts Migration
- **Current State**: Mix of direct client usage and partial factory patterns
- **Target**: Full migration to existing factory-based tag API
- **Approach**:
  - Audit all usage of legacy `tags.ts`
  - Migrate consumers to factory-based tag API
  - Remove or deprecate legacy implementations

### Phase 4: Component and Unit Test Evaluation (1 day)

**Objective**: Ensure component and unit tests remain appropriately scoped

#### 4.1 Component Test Review
- **Files**: `tests/components/*.test.tsx`
- **Action**: Keep as unit tests (UI logic, no database needed)
- **Verify**: No accidental API mocking that should be integration tested

#### 4.2 Repository Unit Test Review  
- **Files**: `tests/api/core/repository/repository.test.ts`
- **Action**: Keep as unit tests (testing repository patterns)
- **Verify**: Not duplicating integration test coverage

#### 4.3 Hook Unit Test Review
- **Files**: Various hook tests
- **Decision**: Separate pure logic hooks (unit test) from API hooks (integration test)

### Phase 5: Create Comprehensive Integration Test Coverage (1-2 days)

**Objective**: Ensure full coverage with database integration tests

#### 5.1 API Integration Test Suite
- **Create**: `tests/api/integration/` directory structure
- **Coverage**: All major API operations with authentication
- **Pattern**: Use `CentralTestAuthUtils` for consistent setup

#### 5.2 Hook Integration Test Suite  
- **Update**: All hook tests that interact with APIs to use database integration
- **Focus**: React Query hooks that interact with factory APIs
- **Pattern**: Use `renderHook` with `CentralTestAuthUtils` wrapper

#### 5.3 End-to-End Workflow Tests
- **Create**: Tests that verify complete user workflows
- **Examples**: 
  - User registration → profile creation → organization joining
  - Event creation → tagging → registration
  - Post creation → commenting → liking

## User Assignment Strategy (Updated)

To prevent test interference across 18 test suites:

| User Key | Test Suite Assignment | Current Status | Planned Usage |
|----------|----------------------|----------------|---------------|
| `user1` | Organization operations | Available | `useOrganizationMutations`, `organizationsApi` |
| `user2` | Organization relationships | ✅ In Use | `relationshipsApi.database` (already working) |
| `user3` | Hook testing | Available | `queryHookFactory`, other hook integration tests |
| `user4` | Tag system | ✅ In Use | `tagsApi.integration` (already working) |
| `user5` | Chat/messaging | Available | Future chat test migrations |
| `user6` | Posts/social features | Available | Future post/comment test migrations |

## Implementation Timeline (Updated)

### Week 1
- **Day 1**: Phase 1 (Remove deprecated tests)
- **Days 2-3**: Phase 2 (Convert factory-based mock tests) 
- **Days 4-5**: Phase 3.1 (authApi factory migration)

### Week 2  
- **Days 1-2**: Phase 3.2-3.3 (Complete non-factory API migrations)
- **Day 3**: Phase 4 (Component/unit test evaluation)
- **Days 4-5**: Phase 5 (Comprehensive integration tests)

## Success Metrics (Updated)

### Immediate (End of Phase 1)
- [ ] Zero deprecated mock tests in 18-suite test run
- [ ] All tests either pass or are marked for migration
- [ ] Clear categorization of unit vs integration test needs

### Intermediate (End of Phase 3)
- [ ] All APIs use factory pattern with client injection
- [ ] All factory-based tests use database integration
- [ ] Proper separation of unit tests (no migration needed) vs integration tests

### Final (End of Phase 5)
- [ ] 100% of API interaction tests use database integration
- [ ] Component/unit tests remain appropriately scoped
- [ ] Test suite runs reliably with all 18 suites
- [ ] Clear testing patterns documented for future development

## Test Classification Framework

### Keep as Unit Tests ✅
- **Component rendering tests** (`tests/components/*.test.tsx`)
- **Pure utility function tests** (`tests/utils/*.test.ts`)
- **Repository pattern tests** (`tests/api/core/repository/*.test.ts`)
- **Hook logic tests** (hooks that don't call APIs)

### Migrate to Integration Tests 🔄
- **API operation tests** (currently using mocks)
- **Hook tests that call APIs** (React Query hooks)
- **Database constraint tests**
- **RLS policy validation tests**

### Remove Completely 🗑️
- **Deprecated mock tests** (superseded by integration tests)
- **Duplicate test coverage**
- **Tests of unused/deprecated functionality**

## Risk Mitigation (Updated)

### High-Risk Items
- **Test suite complexity**: 18 suites require careful coordination
- **User isolation**: Prevent interference between parallel test execution
- **Database connectivity**: Ensure reliable test database for all suites

### Medium-Risk Items
- **Performance impact**: More database tests mean slower execution
- **Test categorization**: Ensure proper unit vs integration test separation
- **CI/CD integration**: 18 suites must run reliably in automated environments

### Low-Risk Items
- **Team adoption**: Clear patterns make new test development straightforward
- **Maintenance**: Well-categorized tests are easier to maintain

---

**Document Version**: 2.0  
**Created**: 2025-05-30  
**Updated**: Based on 18 test suite analysis  
**Status**: Ready for Implementation  
**Estimated Effort**: 8-10 days total

