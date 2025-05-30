# Testing Integration Guide

This guide documents how to use the centralized testing utilities with dynamic API registry support.

## Overview

The testing infrastructure now provides:
- Centralized authentication setup for tests
- Dynamic API registry for extensible testing
- Automatic API reset with authenticated clients
- Verification of repository chain flow
- Convenience methods for common testing patterns

## Quick Start

### Basic Test Setup

```typescript
import { CentralTestAuthUtils } from '../api/testing/CentralTestAuthUtils';

describe('My Feature Tests', () => {
  test('should work with authenticated user', async () => {
    await CentralTestAuthUtils.executeWithAuthenticatedAPI('user1', async (client) => {
      // Use client for API operations
      const { data } = await client.from('events').select('*').limit(1);
      expect(data).toBeDefined();
    });
  });
});
```

### Testing Specific APIs

```typescript
import { CentralTestAuthUtils } from '../api/testing/CentralTestAuthUtils';

// Test any registered API
await CentralTestAuthUtils.executeWithSpecificAPI(
  'events', // API name from registry
  async (eventsAPI, { client, user }) => {
    const result = await eventsAPI.createEvent({
      title: 'Test Event',
      description: 'Test description',
      // ... other event properties
    });
    expect(result.status).toBe('success');
  },
  'user1'
);

// Test with tags API
await CentralTestAuthUtils.executeWithSpecificAPI(
  'tags',
  async (tagAPI, { client, user }) => {
    const result = await tagAPI.create({
      name: 'test-tag',
      description: 'Test tag'
    });
    expect(result.status).toBe('success');
  },
  'user2'
);
```

### Testing Multiple APIs

```typescript
await CentralTestAuthUtils.executeWithAllAPIs(
  async (apis, { client, user }) => {
    // Test posts (if reset function available)
    if (apis.posts) {
      const posts = await apis.posts.postsApi.getAll();
      expect(posts.status).toBe('success');
    }
    
    // Test organizations
    if (apis.organization) {
      const orgs = await apis.organization.getAll();
      expect(orgs.status).toBe('success');
    }
    
    // Test chat
    if (apis.chat) {
      const messages = await apis.chat.getAll();
      expect(messages.status).toBe('success');
    }
  },
  'user2'
);
```

## Available APIs

The dynamic registry currently includes:

### APIs with Reset Functions
- `'posts'` - Posts and related APIs
- `'chat'` - Chat message APIs  
- `'organization'` - Organization APIs
- `'profile'` - Profile APIs

### APIs with Factory Functions
- `'events'` - Event APIs (createEvent, etc.)
- `'tags'` - Tag APIs (create, read, update, delete)

### Check Available APIs

```typescript
// Get list of all registered APIs
const availableApis = CentralTestAuthUtils.getAvailableApis();
console.log('Available APIs:', availableApis);

// Check if specific API is available
const hasEventsApi = CentralTestAuthUtils.isApiAvailable('events');
console.log('Events API available:', hasEventsApi);
```

## API Registry System

### Registering New APIs

```typescript
import { testApiRegistry } from '../api/testing/TestApiRegistry';

// Register API with reset function
testApiRegistry.register('myApi', {
  resetFunction: (client) => createMyApi(client),
  description: 'My custom API'
});

// Register API with factory function only
testApiRegistry.register('anotherApi', {
  factoryFunction: myApiFactory,
  description: 'Another API without reset capability'
});
```

### Dynamic API Detection

The registry automatically detects and provides access to:
- APIs with reset functions (for complete testing isolation)
- APIs with factory functions (for direct usage)
- Mixed APIs (with both reset and factory functions)

## Test Users

The system provides persistent test users:
- `'user1'` - Primary test user
- `'user2'` - Secondary test user  
- `'user3'` - Tertiary test user

Each has isolated authentication and can be used for different test scenarios.

## Migration from Old Patterns

### Before (Hard-coded API List)
```typescript
// ❌ Old pattern - limited to hard-coded APIs
await CentralTestAuthUtils.executeWithAuthenticatedAPI(
  'posts', // Limited to: 'posts' | 'chat' | 'organization' | 'profile'
  testFunction,
  'user1'
);
```

### After (Dynamic Registry)
```typescript
// ✅ New pattern - any registered API
await CentralTestAuthUtils.executeWithSpecificAPI(
  'events', // Any registered API: 'posts', 'chat', 'organization', 'profile', 'events', 'tags', etc.
  testFunction,
  'user1'
);
```

## Best Practices

1. **Use specific APIs when possible**: Only test the APIs you need
2. **Check API availability**: Use `isApiAvailable()` for conditional testing
3. **Register new APIs**: Add your APIs to the registry for consistent testing
4. **Use appropriate test users**: Distribute tests across different users for isolation
5. **Clean up properly**: The utilities handle cleanup automatically

## Troubleshooting

### API Not Found Errors
- Check available APIs with `getAvailableApis()`
- Ensure your API is registered in the TestApiRegistry
- Verify the API name matches exactly (case-sensitive)

### Authentication Errors
- Ensure test users exist in `PERSISTENT_TEST_USERS`
- Check that the test client is properly configured
- Verify RLS policies allow the test operations

This new system provides extensible testing support for any API without hard-coded limitations.
