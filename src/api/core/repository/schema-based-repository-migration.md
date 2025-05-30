
# Schema-Based Repository Migration Plan

## Overview

This document outlines the completed migration from code-based mock repositories to a schema-based testing approach using Supabase's `testing` schema. This approach improves test reliability, maintainability, and provides a more production-like testing environment.

## Completed Architecture

We have successfully streamlined the architecture to focus on a real database approach using schemas:

### Core Repository Structure
1. ✅ `BaseRepository` - Abstract base class for all repositories
2. ✅ `SupabaseRepository` - Enhanced with schema support (default: 'public', testing: 'testing')
3. ✅ `EntityRepository` - Entity-specific operations layer
4. ✅ Removed `MockRepository` and mock-specific factory functions

### Repository Factory Functions
1. ✅ `createRepository` - Simplified to use schema-based approach
2. ✅ `createTestingRepository` - Creates repositories that use the 'testing' schema

### Testing Framework
1. ✅ Test Setup: Clone schema structure from 'public' to 'testing'
2. ✅ Isolated Test Environment: Each test suite can start with a clean testing schema
3. ✅ Test Data Management: Utilities to seed and clean up test data

## Migration Results

### 1. Database Setup
- ✅ Ensured the `testing` schema exists in Supabase
- ✅ Utilized existing `setup_testing_schema()` function to replicate public schema structure
- ✅ Implemented helper functions for test data management

### 2. Repository Changes

#### Updated `SupabaseRepository`
- ✅ Added schema support
- ✅ All operations respect the schema setting
- ✅ Added methods to switch schemas dynamically

#### Simplified Factory Functions
- ✅ Updated `createRepository` to support schema specification
- ✅ Created `createTestingRepository` that defaults to the 'testing' schema
- ✅ Removed mock repository related code

#### Updated Entity Repositories
- ✅ Added test-specific factory functions

### 3. Testing Framework

#### Test Utilities
- ✅ Created utilities for test setup and teardown
- ✅ Added functions for test data generation and management
- ✅ Implemented transaction support for test isolation

#### Test Schema Management
```typescript
// Test setup function
export async function setupTestSchema() {
  // Use the existing setup_testing_schema() function
  await supabase.rpc('setup_testing_schema');
}

// Test data utility
export async function seedTestData<T>(
  tableName: string, 
  data: T[]
): Promise<void> {
  // Insert test data into the testing schema
  await supabase
    .from(tableName)
    .insert(data)
    .schema('testing');
}

// Test cleanup
export async function cleanupTestData(tableName: string): Promise<void> {
  // Clear test data from a specific table
  await supabase
    .from(tableName)
    .delete()
    .schema('testing');
}
```

### 4. Migration Completed

1. **Repository Core Updates**: ✅ COMPLETED
   - Updated all repository factory functions
   - Removed mock repository code
   - All data access uses the schema parameter

2. **Test Migration**: ✅ COMPLETED
   - Migrated test suites to use testing schema repositories
   - Updated test setup/teardown
   - Converted from mock patterns to schema-based testing

3. **Validation**: ✅ COMPLETED
   - All tests pass with the new approach
   - Test isolation verified
   - Performance validated

## Benefits Achieved

- **Improved Test Fidelity**: Tests run against real database infrastructure
- **Simplified Architecture**: Fewer repository types and factories
- **Better Test Isolation**: Each test uses an isolated schema
- **Reduced Maintenance**: No need to maintain mock implementations
- **Easier Debugging**: Tests fail for the same reasons production would

## Technical Implementation

### Using SQL Functions

The migration leveraged existing SQL functions:

- `setup_testing_schema()`: Replicates public schema structure to testing schema
- `exec_sql(query text)`: Executes SQL queries, useful for test setup/teardown

These functions provide the foundation for our testing environment.

### Current Usage

```typescript
// Setting up test environment
beforeAll(async () => {
  await supabase.rpc('setup_testing_schema');
});

// Test-specific repository
const testRepo = createTestingRepository<User>('users');

// Using the repository in tests
test('should create user', async () => {
  const user = { name: 'Test User', email: 'test@example.com' };
  const result = await testRepo.insert(user).single();
  expect(result.error).toBeNull();
  expect(result.data.name).toBe('Test User');
});

// Cleanup after test
afterAll(async () => {
  await clearTestTable('users');
});
```

## Conclusion

This migration has successfully improved our testing approach. By using schema-based testing instead of code mocks, we gained reliability, simplicity, and a closer approximation of production behavior. The architecture is now cleaner, more maintainable, and provides better test coverage.
