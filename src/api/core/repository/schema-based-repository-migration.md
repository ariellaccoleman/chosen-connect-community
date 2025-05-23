
# Schema-Based Repository Migration Plan

## Overview

This document outlines the plan to migrate from code-based mock repositories to a schema-based testing approach using Supabase's `testing` schema. This approach will improve test reliability, maintainability, and provide a more production-like testing environment.

## Current Architecture

Currently, our repository pattern includes:
- `BaseRepository` - Abstract base class for all repositories
- `SupabaseRepository` - Implementation for Supabase database
- `MockRepository` - Implementation for mock data in tests
- Entity-specific repositories that extend the base repositories
- Factory functions to create the appropriate repository instance

## Target Architecture

We will streamline the architecture to focus on a real database approach using schemas:

### Core Repository Structure
1. ✅ `BaseRepository` - Keep as is, with abstract methods
2. ✅ `SupabaseRepository` - Enhanced with schema support (default: 'public', testing: 'testing')
3. `EntityRepository` - Keep this layer for entity-specific operations
4. Remove `MockRepository` and mock-specific factory functions

### Repository Factory Functions
1. ✅ `createRepository` - Simplified to use schema-based approach
2. ✅ `createTestingRepository` - Creates repositories that use the 'testing' schema

### Testing Framework
1. ✅ Test Setup: Clone schema structure from 'public' to 'testing'
2. ✅ Isolated Test Environment: Each test suite can start with a clean testing schema
3. ✅ Test Data Management: Utilities to seed and clean up test data

## Migration Steps

### 1. Database Setup
- ✅ Ensure the `testing` schema exists in Supabase
- ✅ Utilize existing `setup_testing_schema()` function to replicate public schema structure
- ✅ Implement helper functions for test data management

### 2. Repository Changes

#### Update `SupabaseRepository`
- ✅ Add schema support (already completed)
- ✅ Ensure all operations respect the schema setting
- ✅ Add methods to switch schemas dynamically

#### Simplify Factory Functions
- ✅ Update `createRepository` to support schema specification
- ✅ Create `createTestingRepository` that defaults to the 'testing' schema
- ✅ Remove mock repository related code

#### Update Entity Repositories
- Add test-specific factory functions if needed

### 3. Testing Framework

#### Test Utilities
- ✅ Create utilities for test setup and teardown
- ✅ Add functions for test data generation and management
- Implement transaction support for test isolation

#### Test Schema Management
```typescript
// Example test setup function
export async function setupTestSchema() {
  // Use the existing setup_testing_schema() function
  await supabase.rpc('setup_testing_schema');
}

// Example test data utility
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

// Example test cleanup
export async function cleanupTestData(tableName: string): Promise<void> {
  // Clear test data from a specific table
  await supabase
    .from(tableName)
    .delete()
    .schema('testing');
}
```

### 4. Migration Process

1. **Repository Core Updates**:
   - ✅ Update all repository factory functions
   - ✅ Remove mock repository code
   - ✅ Ensure all data access uses the schema parameter

2. **Test Migration**:
   - Identify test suites using mock repositories
   - Convert to use testing schema repositories
   - Update test setup/teardown

3. **Validation**:
   - Ensure all tests pass with the new approach
   - Verify test isolation
   - Validate performance

## Benefits

- **Improved Test Fidelity**: Tests run against real database infrastructure
- **Simplified Architecture**: Fewer repository types and factories
- **Better Test Isolation**: Each test uses an isolated schema
- **Reduced Maintenance**: No need to maintain mock implementations
- **Easier Debugging**: Tests fail for the same reasons production would

## Implementation Timeline

1. Phase 1: ✅ Update repository core with schema support (completed)
2. Phase 2: ✅ Create test utilities for the testing schema
3. Phase 3: In Progress: Migrate entity repositories to the new pattern
4. Phase 4: Convert existing tests to use the testing schema
5. Phase 5: Remove deprecated mock repositories and related code

## Technical Details

### Using Existing SQL Functions

The migration will leverage existing SQL functions:

- `setup_testing_schema()`: Replicates public schema structure to testing schema
- `exec_sql(query text)`: Executes SQL queries, useful for test setup/teardown

These functions provide the foundation for our testing environment.

### Example Usage

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
  await clearupTestData('users');
});
```

## Conclusion

This migration represents a significant improvement in our testing approach. By using schema-based testing instead of code mocks, we gain reliability, simplicity, and a closer approximation of production behavior.
