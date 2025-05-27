
# Test Setup Guide

This guide explains how to set up integration and database tests using our authentication patterns and test utilities.

## Overview

Our test infrastructure provides a reliable way to test API operations with proper authentication and data isolation. We use persistent test users and dedicated test utilities to ensure tests don't interfere with each other.

## Available Test Users

We have 6 persistent test users available for testing:

- `user1` → `testuser4@example.com`
- `user2` → `testuser5@example.com` 
- `user3` → `testuser6@example.com`
- `user4` → `testuser1@example.com`
- `user5` → `testuser2@example.com`
- `user6` → `testuser3@example.com`

All users share the same password defined in `TEST_USER_CONFIG.password`.

## Test User Assignment Strategy

To prevent test interference, assign different users to different test suites that might access the same database tables:

- **Database tests** (direct database operations): Use `user1`
- **Integration tests** (API calls): Use `user2`
- **Additional test suites**: Use `user3`, `user4`, etc.

## Basic Test Setup Pattern

### 1. Required Imports

```typescript
import { TestClientFactory } from '@/integrations/supabase/testClient';
import { PersistentTestUserHelper } from '../utils/persistentTestUsers';
import { TestAuthUtils } from '../utils/testAuthUtils';
import { v4 as uuidv4 } from 'uuid';
```

### 2. Test Structure Template

```typescript
describe('Your API Tests', () => {
  let testUser: any;
  let testOrganization: any;
  let createdRelationshipIds: string[] = [];
  let createdOrganizationIds: string[] = [];
  let testOrgName: string;
  
  beforeAll(async () => {
    // Verify test users are set up
    const isSetup = await PersistentTestUserHelper.verifyTestUsersSetup();
    if (!isSetup) {
      console.warn('⚠️ Persistent test users not set up - some tests may fail');
    }

    // Verify service role key is available (if needed for setup)
    try {
      TestClientFactory.getServiceRoleClient();
      console.log('✅ Service role client available for tests');
    } catch (error) {
      console.error('❌ Service role client not available:', error);
      throw error;
    }
  });

  beforeEach(async () => {
    // Clean up any existing test data first
    await cleanupTestData();
    
    // Reset tracking arrays AFTER cleanup
    createdRelationshipIds = [];
    createdOrganizationIds = [];
    
    // Set up authentication - CHANGE USER NUMBER FOR DIFFERENT TEST SUITES
    try {
      console.log('🔐 Setting up test authentication for user2...');
      await TestAuthUtils.setupTestAuth('user2'); // Use different user per test suite
      
      // Wait for auth to settle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the authenticated user
      testUser = await TestAuthUtils.getCurrentTestUser();
      console.log(`✅ Test user authenticated: ${testUser?.email}`);
      
      // Verify session is established
      const client = await TestClientFactory.getSharedTestClient();
      const { data: { session } } = await client.auth.getSession();
      if (!session) {
        throw new Error('Authentication failed - no session established');
      }
    } catch (error) {
      console.warn('Could not get test user, using mock ID:', error);
      testUser = { 
        id: uuidv4(),
        email: 'testuser5@example.com' // Match the user number you chose above
      };
    }
    
    // Set up test data (organizations, etc.)
    await setupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
    await TestAuthUtils.cleanupTestAuth();
  });

  afterAll(() => {
    TestClientFactory.cleanup();
  });

  // Your tests here...
});
```

### 3. Authentication Functions

#### `TestAuthUtils.setupTestAuth(userKey)`
Authenticates the shared test client with a specific user.

```typescript
// Use different users for different test suites
await TestAuthUtils.setupTestAuth('user1'); // For database tests
await TestAuthUtils.setupTestAuth('user2'); // For integration tests
await TestAuthUtils.setupTestAuth('user3'); // For additional test suites
```

#### `TestAuthUtils.getCurrentTestUser()`
Gets the currently authenticated user from the shared client.

```typescript
const testUser = await TestAuthUtils.getCurrentTestUser();
console.log(`Authenticated as: ${testUser.email}`);
```

#### `TestAuthUtils.cleanupTestAuth()`
Signs out the current user and cleans up authentication state.

```typescript
await TestAuthUtils.cleanupTestAuth();
```

## Setup and Cleanup Patterns

### Data Cleanup Function

Create a cleanup function that handles all test data:

```typescript
const cleanupTestData = async () => {
  try {
    const serviceClient = TestClientFactory.getServiceRoleClient();
    
    // Clean up by tracked IDs (most reliable)
    if (createdRelationshipIds.length > 0) {
      const { error } = await serviceClient
        .from('org_relationships')
        .delete()
        .in('id', createdRelationshipIds);
      
      if (!error) {
        console.log(`✅ Cleaned up ${createdRelationshipIds.length} relationships`);
      }
    }
    
    // Clean up organizations
    if (createdOrganizationIds.length > 0) {
      const { error } = await serviceClient
        .from('organizations')
        .delete()
        .in('id', createdOrganizationIds);
      
      if (!error) {
        console.log(`✅ Cleaned up ${createdOrganizationIds.length} organizations`);
      }
    }
    
    // Fallback cleanup by user ID
    if (testUser?.id) {
      await serviceClient
        .from('org_relationships')
        .delete()
        .eq('profile_id', testUser.id);
    }
    
    // Cleanup by naming pattern (additional safety net)
    if (testOrgName) {
      await serviceClient
        .from('organizations')
        .delete()
        .eq('name', testOrgName);
    }
    
  } catch (error) {
    console.warn('Cleanup warning:', error);
  }
};
```

### Test Data Setup

```typescript
const setupTestData = async () => {
  if (!testUser?.id) return;
  
  const serviceClient = TestClientFactory.getServiceRoleClient();
  
  // Ensure profile exists
  const { error: profileError } = await serviceClient
    .from('profiles')
    .upsert({ 
      id: testUser.id, 
      email: testUser.email,
      first_name: 'Test',
      last_name: 'User'
    });
  
  if (profileError) {
    console.warn('Profile setup warning:', profileError);
  }
  
  // Create test organization with unique name
  testOrgName = `Test Org ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const { data: orgData, error: orgError } = await serviceClient
    .from('organizations')
    .insert({
      name: testOrgName,
      description: 'Test organization'
    })
    .select()
    .single();
  
  if (orgError) {
    throw new Error(`Failed to create test organization: ${orgError.message}`);
  }
  
  testOrganization = orgData;
  createdOrganizationIds.push(orgData.id);
};
```

## Testing Different User Scenarios

### Testing User Isolation

```typescript
describe('Multi-user scenarios', () => {
  test('different users cannot see each others data', async () => {
    // Create data as user2
    await TestAuthUtils.setupTestAuth('user2');
    const user2 = await TestAuthUtils.getCurrentTestUser();
    
    // Create user2's data
    const result1 = await api.createUserData(user2.id, { name: 'User2 Data' });
    
    // Switch to user3
    await TestAuthUtils.setupTestAuth('user3');
    const user3 = await TestAuthUtils.getCurrentTestUser();
    
    // User3 should not see user2's data
    const result2 = await api.getUserData(user3.id);
    expect(result2.data).toEqual([]);
  });
});
```

### Testing Admin vs Regular User

```typescript
describe('Permission-based tests', () => {
  test('admin can access all data', async () => {
    // Set up as regular user
    await TestAuthUtils.setupTestAuth('user2');
    // ... create some data
    
    // Switch to admin user
    await TestAuthUtils.setupTestAuth('user1'); // Assuming user1 has admin role
    // ... verify admin can access the data
  });
});
```

## Best Practices

### 1. User Assignment
- Assign specific users to specific test suites
- Document which user each test suite uses
- Avoid using the same user across test suites that hit the same tables

### 2. Naming Conventions
- Use descriptive, unique names for test data
- Include timestamps or random strings in test data names
- Use different naming patterns for different test suites

### 3. Cleanup Strategy
- Always clean up data in `afterEach` AND at the start of `beforeEach`
- Track created IDs for reliable cleanup
- Implement fallback cleanup strategies
- Use the service role client for cleanup operations

### 4. Error Handling
- Always wrap authentication setup in try-catch
- Provide fallback mock users if authentication fails
- Skip tests gracefully if setup fails

### 5. Debugging
- Use descriptive console.log messages
- Verify session state after authentication
- Log test data creation and cleanup

## Common Patterns

### Integration Test (API Calls)
```typescript
test('API endpoint works correctly', async () => {
  // Direct API call using authenticated client
  const result = await yourApi.createSomething({
    user_id: testUser.id,
    name: 'Test Item'
  });
  
  expect(result.status).toBe('success');
  
  // Track created item for cleanup
  if (result.data.id) {
    createdItemIds.push(result.data.id);
  }
});
```

### Database Test (Direct Database Access)
```typescript
test('database operation works correctly', async () => {
  // Direct database operation using service client
  const serviceClient = TestClientFactory.getServiceRoleClient();
  
  const { data, error } = await serviceClient
    .from('your_table')
    .insert({ user_id: testUser.id, name: 'Test Item' })
    .select()
    .single();
  
  expect(error).toBeNull();
  expect(data.name).toBe('Test Item');
  
  // Track for cleanup
  createdItemIds.push(data.id);
});
```

This pattern ensures reliable, isolated testing with proper authentication and cleanup.
