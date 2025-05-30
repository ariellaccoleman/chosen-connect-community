
# Test Migration Plan: From Mocks to Database Integration

## Executive Summary

This plan outlines the migration of skipped tests from mock-based testing to database integration testing, and the updating of APIs that are not yet using the factory pattern. This will provide more reliable testing that matches production behavior.

## Current State Analysis

### Skipped Tests Identified

1. **tests/hooks/useOrganizationMutations.test.tsx** (Factory-based, skipped)
   - Status: Uses factory pattern, but relies on mocks
   - Migration: Convert to use CentralTestAuthUtils with real database

2. **tests/api/authApi.test.ts** (Mock-based, skipped)
   - Status: Deprecated mock tests
   - Migration: Already has replacement at `tests/api/authApi.integration.test.ts`
   - Action: Remove deprecated test file

### APIs Not Using Factory Pattern

From analysis of the codebase, the following APIs need factory pattern updates:

1. **authApi.ts** - Authentication API
   - Current: Direct Supabase client usage
   - Needs: Factory pattern with client injection support

2. **locationsApi.ts** - Legacy locations API  
   - Current: Direct Supabase client usage
   - Needs: Factory pattern conversion or deprecation in favor of factory-based location API

3. **tags.ts** - Legacy tags API
   - Current: Mixed patterns
   - Needs: Full migration to existing factory-based tag API

## Migration Strategy

### Phase 1: Remove Deprecated Tests (Immediate - 0.5 days)

**Objective**: Clean up test suite by removing superseded mock tests

**Tasks**:
1. Delete `tests/api/authApi.test.ts` (superseded by integration test)
2. Remove any other identified deprecated mock test files
3. Update test scripts if needed

**Success Criteria**:
- No deprecated mock tests remain in test suite
- All remaining tests either pass or are intentionally skipped for migration

### Phase 2: Convert Factory-Based Mock Tests (1-2 days)

**Objective**: Migrate existing factory-based tests from mocks to database integration

**Tasks**:

#### 2.1 Update useOrganizationMutations Test
- **File**: `tests/hooks/useOrganizationMutations.test.tsx`
- **Changes**:
  - Replace mock API responses with `CentralTestAuthUtils.executeWithAuthenticatedAPI`
  - Use real organization factory API with authenticated client
  - Test actual database operations and RLS policies
  - Verify success/error handling with real responses

**Implementation Pattern**:
```typescript
// Old: Mock-based
const mockCreateOrg = jest.spyOn(organizationApi, 'createOrganization')
  .mockResolvedValueOnce({ data: {...}, error: null, status: 'success' });

// New: Database integration
await CentralTestAuthUtils.executeWithAuthenticatedAPI(
  'organization',
  async (orgAPI) => {
    const result = await orgAPI.create({ name: 'Test Org' });
    expect(result.status).toBe('success');
    expect(result.data).toBeTruthy();
  }
);
```

#### 2.2 Identify and Convert Other Factory-Based Mock Tests
- **Search criteria**: Tests using factory APIs but with mocked responses
- **Pattern**: Look for `jest.spyOn` on factory APIs, `mockResolvedValue`, etc.
- **Convert**: Each test to use `CentralTestAuthUtils` with real database

### Phase 3: Convert Non-Factory APIs to Factory Pattern (2-3 days)

**Objective**: Update remaining APIs to use factory pattern for consistency and testability

#### 3.1 authApi.ts Migration
- **Current State**: Direct Supabase client usage in auth operations
- **Target**: Factory pattern with client injection
- **Approach**:
  - Create `authApiFactory.ts` with `resetAuthApi(client?)` function
  - Maintain existing `authApi.ts` as default export for backward compatibility
  - Update existing integration tests to use factory pattern
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

### Phase 4: Create Comprehensive Integration Tests (1-2 days)

**Objective**: Ensure full coverage with database integration tests

#### 4.1 API Integration Test Suite
- **Create**: `tests/api/integration/` directory structure
- **Coverage**: All major API operations with authentication
- **Pattern**: Use `CentralTestAuthUtils` for consistent setup

#### 4.2 Hook Integration Test Suite  
- **Update**: All hook tests to use database integration where applicable
- **Focus**: React Query hooks that interact with factory APIs
- **Pattern**: Use `renderHook` with `CentralTestAuthUtils` wrapper

#### 4.3 End-to-End Workflow Tests
- **Create**: Tests that verify complete user workflows
- **Examples**: 
  - User registration → profile creation → organization joining
  - Event creation → tagging → registration
  - Post creation → commenting → liking

### Phase 5: Optimize and Validate (0.5-1 day)

**Objective**: Ensure migration is complete and performant

#### 5.1 Test Performance Optimization
- **Database**: Optimize test data cleanup and setup
- **Parallel**: Ensure tests can run in parallel safely
- **CI/CD**: Verify test suite performance in automated environments

#### 5.2 Migration Validation
- **Coverage**: Verify no functionality lost in migration
- **Documentation**: Update test documentation and guidelines
- **Team Training**: Document new patterns for team

## Implementation Timeline

### Week 1
- **Days 1-1**: Phase 1 (Remove deprecated tests)
- **Days 2-3**: Phase 2 (Convert factory-based mock tests) 
- **Days 4-5**: Phase 3.1 (authApi factory migration)

### Week 2  
- **Days 1-2**: Phase 3.2-3.3 (Complete non-factory API migrations)
- **Days 3-4**: Phase 4 (Comprehensive integration tests)
- **Day 5**: Phase 5 (Optimize and validate)

## Success Metrics

### Immediate (End of Phase 1)
- [ ] Zero deprecated mock tests in test suite
- [ ] All tests either pass or are marked for migration

### Intermediate (End of Phase 3)
- [ ] All APIs use factory pattern with client injection
- [ ] All factory-based tests use database integration
- [ ] Test coverage maintained or improved

### Final (End of Phase 5)
- [ ] 100% of tests use database integration (no mocks for API calls)
- [ ] Test suite runs reliably in CI/CD
- [ ] Test performance within acceptable limits
- [ ] Team documentation updated

## Risk Mitigation

### High-Risk Items
- **Database connectivity**: Ensure reliable test database connection
- **RLS policies**: Verify all tests respect Row-Level Security
- **Test isolation**: Prevent test data contamination between tests

### Medium-Risk Items
- **Performance**: Database tests slower than mocks - optimize setup/teardown
- **Complexity**: More complex test setup - provide good utilities and documentation
- **Dependencies**: External dependencies for test database - document requirements

### Low-Risk Items
- **Learning curve**: Team adaptation to new patterns - provide training and examples
- **Maintenance**: Slightly more complex test maintenance - offset by reliability gains

## Dependencies

### Technical Dependencies
- **Test Database**: Reliable Supabase test project access
- **Authentication**: Test user management system (`CentralTestAuthUtils`)
- **Factory APIs**: All APIs converted to factory pattern

### Team Dependencies
- **Code Review**: Technical review of migration changes
- **Testing**: Validation of migrated tests
- **Documentation**: Update of team testing guidelines

## Notes

### Backward Compatibility
- Maintain existing API exports during migration
- Provide deprecation warnings where appropriate
- Ensure no breaking changes to existing working code

### Future Considerations
- Consider test data seeding strategies for complex scenarios
- Plan for test suite scaling as application grows
- Document patterns for future API development

---

**Document Version**: 1.0  
**Created**: 2025-05-30  
**Status**: Ready for Implementation  
**Estimated Effort**: 8-10 days total
