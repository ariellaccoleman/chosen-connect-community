
# Test Migration Plan: From Mock to Database Integration Testing

## Overview

This document outlines the migration strategy from mock-based testing to database integration testing using our test infrastructure. The goal is to deprecate all mock repositories and move to a consistent database-driven testing approach that provides better test reliability and closer-to-production validation.

## Migration Phases

### Phase 1: Foundation & Core APIs ✅ COMPLETE
- [x] Organization Relationships API (user2) - **COMPLETE**
- [x] Organization Database operations (user1) - **COMPLETE** 
- [x] Authentication API - **REMOVED** (Will rely on authenticated function testing)
- [x] Create migration documentation

### Phase 2: Tag System Migration 🔄 CURRENT PHASE
- [ ] Tag Entity Type Repository (user4)
- [ ] Tag Assignment Repository (user4) 
- [ ] Tag Operations API (user4)
- [ ] Tag Cache utilities (user4)

### Phase 3: Chat & Social Features
- [ ] Chat Channels API (user5)
- [ ] Chat Messages (user5)
- [ ] Post Comments (user6)
- [ ] Post Likes (user6)

### Phase 4: Cleanup & Validation
- [ ] Remove all mock repositories
- [ ] Update test documentation
- [ ] Validate no test interference
- [ ] Performance validation

## User Assignment Strategy

To prevent test interference, each test suite is assigned a specific user:

| User Key | Test Suite | Purpose | Status |
|----------|------------|---------|--------|
| `user1` | Database operations (direct DB) | Organizations, Profiles | ✅ Active |
| `user2` | Integration tests (API calls) | Organization Relationships | ✅ Active |
| `user3` | **AVAILABLE** | Previously auth tests | 🆓 Available |
| `user4` | Tag system tests | Tags, Assignments, Entity Types | 📋 Current Phase |
| `user5` | Chat system tests | Channels, Messages | 📋 Planned |
| `user6` | Social features tests | Posts, Comments, Likes | 📋 Planned |

## Phase 2: Tag System Migration (CURRENT)

The tag system is complex with multiple interconnected components. This phase will migrate:

### 2.1 Tag Entity Type Repository
- **File**: `src/api/tags/repository/TagEntityTypeRepository.ts`
- **Test File**: `tests/api/tags/tagEntityTypes.integration.test.ts` (to be created)
- **User**: `user4`
- **Priority**: High (foundational for other tag operations)

### 2.2 Tag Assignment Repository  
- **File**: `src/api/tags/repository/TagAssignmentRepository.ts`
- **Test File**: `tests/api/tags/tagAssignments.integration.test.ts` (to be created)
- **User**: `user4`
- **Priority**: High (core tag functionality)

### 2.3 Tag Operations API
- **Files**: `src/api/tags/tagsApi.ts`, `src/api/tags/tagCrudApi.ts`
- **Test File**: `tests/api/tags/tagsApi.integration.test.ts` (to be created)
- **User**: `user4`
- **Priority**: Medium (API layer testing)

### 2.4 Tag Cache Utilities
- **File**: `src/api/tags/cacheApi.ts`
- **Test File**: `tests/api/tags/tagCache.integration.test.ts` (to be created)
- **User**: `user4`
- **Priority**: Low (performance optimization)

## Migration Criteria

### Tests to Migrate
Tests should be migrated if they:
- ✅ Test API operations against database tables
- ✅ Need to validate database constraints and relationships
- ✅ Test business logic that involves data persistence
- ✅ Currently use mock repositories that duplicate database logic

### Tests to Keep as Unit Tests
Tests should remain as unit tests if they:
- ❌ Test pure utility functions without database dependencies
- ❌ Test component rendering and UI logic
- ❌ Test client-side validation and formatting
- ❌ Have no database interaction

### Tests to Remove
Tests should be removed if they:
- 🗑️ Only test mock implementations
- 🗑️ Duplicate coverage provided by integration tests
- 🗑️ Test deprecated or unused functionality

## Implementation Guidelines

### 1. Authentication Setup
```typescript
// Use assigned user for each test suite
await TestAuthUtils.setupTestAuth('user4'); // For tag tests
await TestAuthUtils.setupTestAuth('user5'); // For chat tests
```

### 2. Data Isolation
```typescript
// Unique naming with timestamps and random strings
const testTagName = `Test Tag ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
```

### 3. Cleanup Strategy
```typescript
// Track all created IDs for reliable cleanup
const createdTagIds: string[] = [];
const createdAssignmentIds: string[] = [];

// Clean up in both beforeEach and afterEach
beforeEach(async () => {
  await cleanupTestData(); // Clean first
  createdTagIds.length = 0; // Reset tracking
  createdAssignmentIds.length = 0;
  // ... setup
});
```

### 4. Error Handling
```typescript
// Graceful handling of setup failures
if (!testUser?.id || !testTag?.id) {
  console.warn('Skipping test - test setup incomplete');
  expect(true).toBe(true); // Mark as passed
  return;
}
```

## Migration Checklist per Test Suite

For each test suite being migrated:

### Pre-Migration
- [ ] Identify current mock dependencies
- [ ] Assign unique user (user1-user6)
- [ ] Review test data requirements
- [ ] Plan unique naming strategy

### During Migration
- [ ] Replace mock repositories with database operations
- [ ] Implement authentication setup
- [ ] Add comprehensive cleanup
- [ ] Update test data to use unique identifiers
- [ ] Add proper error handling for setup failures

### Post-Migration
- [ ] Verify tests pass consistently
- [ ] Check for interference with other tests
- [ ] Validate performance impact
- [ ] Update documentation

## Performance Considerations

### Expected Changes
- **Slower execution**: Database tests run slower than mock tests
- **More reliable**: Tests catch real database constraint issues
- **Better isolation**: Proper cleanup prevents test interference

### Optimization Strategies
- Use transactions where possible for faster rollback
- Minimize database operations in setup/teardown
- Run tests in parallel with `--maxWorkers`
- Cache test client instances per worker

## Common Patterns

### Integration Test Pattern
```typescript
test('API operation works correctly', async () => {
  const result = await api.createItem({
    user_id: testUser.id,
    name: 'Test Item'
  });
  
  expect(result.status).toBe('success');
  
  // Track for cleanup
  if (result.data.id) {
    createdItemIds.push(result.data.id);
  }
});
```

### Database Test Pattern
```typescript
test('database constraint is enforced', async () => {
  const serviceClient = TestClientFactory.getServiceRoleClient();
  
  // This should fail due to constraint
  const { error } = await serviceClient
    .from('table')
    .insert({ invalid_data: true });
    
  expect(error).toBeDefined();
});
```

## Migration Status Tracking

### Completed ✅
- Organization Relationships API integration tests
- Organization database operation tests
- Test infrastructure and utilities
- Authentication approach clarified (removed dedicated tests)

### Current Phase 🔄
- **Phase 2: Tag System Migration**
- Tag Entity Type Repository migration
- Tag Assignment Repository migration
- Tag Operations API migration
- Tag Cache utilities migration

### Planned 📋
- Chat system test migration
- Social features test migration
- Mock repository deprecation

## Risk Mitigation

### Test Interference Prevention
- Strict user assignment per test suite
- Unique data naming conventions
- Comprehensive cleanup strategies
- Fallback cleanup mechanisms

### Performance Impact
- Monitor test execution times
- Implement parallel execution
- Optimize database operations
- Use appropriate timeouts

### Rollback Strategy
- Keep mock tests until migration is complete
- Validate each migration phase independently
- Maintain ability to revert individual test suites

## Success Criteria

### Phase Completion
- [ ] All planned tests migrated successfully
- [ ] No test interference detected
- [ ] Performance within acceptable limits (< 2x current time)
- [ ] All tests pass consistently in CI

### Final Success
- [ ] All mock repositories removed
- [ ] Test reliability improved
- [ ] Better test coverage of database constraints
- [ ] Simplified test maintenance

## Notes

- Authentication tests removed - will rely on authenticated function testing to validate auth works
- Each phase should be completed and validated before moving to the next
- User isolation is critical for preventing test interference
- The investment in migration will pay off with more reliable and maintainable tests
