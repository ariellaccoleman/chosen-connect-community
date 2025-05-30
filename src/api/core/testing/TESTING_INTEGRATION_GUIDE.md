
# Testing Integration Guide

This guide documents how to use the new centralized testing utilities that integrate with the API Factory reset functions.

## Overview

The testing infrastructure now provides:
- Centralized authentication setup for tests
- Automatic API reset with authenticated clients
- Verification of repository chain flow
- Convenience methods for common testing patterns

## Quick Start

### Basic Test Setup

```typescript
import { CentralTestAuthUtils } from '@/api/core/testing/testAuthUtils';

describe('My Feature Tests', () => {
  test('should work with authenticated user', async () => {
    const { resetAPIs, user, cleanup } = await CentralTestAuthUtils.setupTestWithResetAPIs('user1');
    
    try {
      // Use resetAPIs.postsAPI, resetAPIs.chatAPI, etc.
      const result = await resetAPIs.postsAPI.postsApi.getAll();
      expect(result.status).toBe('success');
    } finally {
      await cleanup();
    }
  });
});
```

### Testing Specific APIs

```typescript
// Test only posts API
await CentralTestAuthUtils.executeWithAuthenticatedAPI(
  'posts',
  async (postsAPI, { user }) => {
    const result = await postsAPI.postsApi.createPostWithTags({
      content: 'Test post',
      tag_ids: []
    });
    expect(result.status).toBe('success');
  },
  'user1'
);
```

### Testing Multiple APIs

```typescript
await CentralTestAuthUtils.executeWithAllAPIs(
  async (apis, { user }) => {
    // Test posts
    const post = await apis.postsAPI.postsApi.getAll();
    
    // Test organizations
    const orgs = await apis.organizationAPI.getAll();
    
    // Test chat
    const messages = await apis.chatAPI.messages.getAll();
    
    expect(post.status).toBe('success');
    expect(orgs.status).toBe('success');
    expect(messages.status).toBe('success');
  },
  'user2'
);
```

## Available APIs

### Posts API
```typescript
const { postsAPI } = resetAPIs;
// Access:
// - postsAPI.postsApi (main posts operations)
// - postsAPI.commentsApi (comments operations)
// - postsAPI.postLikesApi (post likes)
// - postsAPI.commentLikesApi (comment likes)
```

### Chat API
```typescript
const { chatAPI } = resetAPIs;
// Access:
// - chatAPI.messages (chat message operations)
```

### Organization API
```typescript
const { organizationAPI } = resetAPIs;
// Access: Standard CRUD operations (getAll, getById, create, update, delete)
```

### Profile API
```typescript
const { profileAPI } = resetAPIs;
// Access: Standard CRUD operations (getAll, getById, create, update, delete)
```

## Test Users

The system provides three test users:
- `'user1'` - Primary test user
- `'user2'` - Secondary test user  
- `'user3'` - Tertiary test user

Each has isolated authentication and can be used for different test scenarios.

## Repository Chain Verification

Verify that client parameters flow correctly through the repository chain:

```typescript
test('repository chain should work', async () => {
  const { client } = await CentralTestAuthUtils.setupTestWithResetAPIs('user1');
  
  const verification = await CentralTestAuthUtils.verifyRepositoryChainFlow(client);
  
  expect(verification.success).toBe(true);
  expect(verification.results.posts).toBe(true);
  expect(verification.results.chat).toBe(true);
  expect(verification.results.organization).toBe(true);
  expect(verification.results.profile).toBe(true);
});
```

## Migration from Old Patterns

### Before (Using Static Imports)
```typescript
// ❌ Old pattern - static imports
import { postsApi } from '@/api/posts/postsApiFactory';

test('old test', async () => {
  // This uses unauthenticated client
  const result = await postsApi.getAll();
});
```

### After (Using Reset APIs)
```typescript
// ✅ New pattern - reset APIs with authentication
import { CentralTestAuthUtils } from '@/api/core/testing/testAuthUtils';

test('new test', async () => {
  await CentralTestAuthUtils.executeWithAuthenticatedAPI(
    'posts',
    async (postsAPI) => {
      // This uses authenticated client
      const result = await postsAPI.postsApi.getAll();
      expect(result.status).toBe('success');
    }
  );
});
```

## Error Handling

The utilities include comprehensive error handling:

```typescript
try {
  const { resetAPIs } = await CentralTestAuthUtils.setupTestWithResetAPIs('user1');
  // Test operations...
} catch (error) {
  // Authentication or setup errors are logged and re-thrown
  console.error('Test setup failed:', error);
}
```

## Debug Information

Get debug information about the testing state:

```typescript
const debugInfo = CentralTestAuthUtils.getDebugInfo();
console.log('Testing debug info:', debugInfo);
```

## Best Practices

1. **Always use cleanup**: Ensure `cleanup()` is called in `finally` blocks or use the convenience methods
2. **Use specific APIs when possible**: Only reset the APIs you need for your test
3. **Verify authentication**: Check that operations work with authenticated clients
4. **Test isolation**: Each test should start with fresh authentication state
5. **Error handling**: Wrap test operations in try/catch for better debugging

## Troubleshooting

### Authentication Errors
- Ensure test users exist in `PERSISTENT_TEST_USERS`
- Check that the test client is properly configured
- Verify RLS policies allow the test operations

### API Reset Issues
- Check that the reset function exists for your API
- Ensure the client parameter is being passed correctly
- Verify the repository chain is complete

### Repository Chain Problems
- Use `verifyRepositoryChainFlow()` to diagnose issues
- Check that `createRepository` is receiving the client parameter
- Ensure no `createClientAwareRepository` calls remain

This integration completes the test fix implementation and provides a solid foundation for authenticated testing across the application.
