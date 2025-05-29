
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

## Implementation Status

### Phase 1: Core Infrastructure (COMPLETE)
✅ **Update core repository factories** - Added client parameter support to `createRepository` functions

### Phase 2: API Factory Updates (COMPLETE)
✅ **Added reset functions to API factories** - All major API factories now have `resetApi(client)` functions

### Current Build Issues Identified
- Repository factory functions don't accept client parameter yet
- Service functions need client parameter support
- Export conflicts from multiple `resetApi` exports
- Chat message service functions need client parameter updates

## Phase 3: Infrastructure Updates and Conflict Resolution (CURRENT)

### 3.1 Repository Factory Updates
**Files to modify:**
- `src/api/core/repository/repositoryFactory.ts` - Add client parameter support
- `src/api/core/factory/apiFactory.ts` - Update to handle client injection properly

**Changes needed:**
```typescript
// Update RepositoryOptions to include client
export interface RepositoryOptions {
  schema?: string;
  enableLogging?: boolean;
  initialData?: any[];
  client?: any; // Add client parameter
}

// Update createRepository to accept and use client
export function createRepository<T>(
  tableName: string,
  options: RepositoryOptions = {},
  providedClient?: any // Add client parameter
): BaseRepository<T>
```

### 3.2 Service Function Updates
**Files to modify:**
- `src/api/chat/chatMessageService.ts` - Add client parameter to all functions

**Changes needed:**
- Update `getChannelMessages(channelId, limit?, offset?, client?)`
- Update `getThreadReplies(messageId, limit?, offset?, client?)`
- Update `sendChatMessage(channelId, message, userId, parentId?, client?)`
- Update `getChannelMessagePreviews(channelId, client?)`

### 3.3 Export Conflict Resolution Strategy

**DECISION: Rename Factory Reset Functions**

To resolve export conflicts while maintaining clarity, I'm implementing this strategy:

1. **Rename all factory `resetApi` functions** to be factory-specific:
   - `profileApiFactory.ts` → `resetProfileApi(client)`
   - `organizationApiFactory.ts` → `resetOrganizationApi(client)`
   - `eventApiFactory.ts` → `resetEventApi(client)`
   - `hubApiFactory.ts` → `resetHubApi(client)`
   - `locationsApi.ts` → `resetLocationsApi(client)`
   - `chatChannelsApi.ts` → `resetChatChannelsApi(client)`
   - `chatMessageApiFactory.ts` → `resetChatMessageApi(client)`
   - `tagApiFactory.ts` → `resetTagApi(client)`

2. **Create a central reset utility** that imports and re-exports all specific reset functions:

```typescript
// src/api/core/apiResetUtils.ts
export { resetProfileApi } from '../profiles/profileApiFactory';
export { resetOrganizationApi } from '../organizations/organizationApiFactory';
export { resetEventApi } from '../events/eventApiFactory';
export { resetHubApi } from '../hubs/hubApiFactory';
export { resetLocationsApi } from '../locations/locationsApi';
export { resetChatChannelsApi } from '../chat/chatChannelsApi';
export { resetChatMessageApi } from '../chat/chatMessageApiFactory';
export { resetTagApi } from '../tags/factory/tagApiFactory';

// Central function that resets all APIs
export const resetAllApis = (client: any) => ({
  profile: resetProfileApi(client),
  organization: resetOrganizationApi(client),
  event: resetEventApi(client),
  hub: resetHubApi(client),
  locations: resetLocationsApi(client),
  chatChannels: resetChatChannelsApi(client),
  chatMessage: resetChatMessageApi(client),
  tag: resetTagApi(client)
});
```

3. **Update index.ts files** to avoid conflicts:
   - Remove `export *` statements that cause conflicts
   - Use explicit exports for non-reset functions only
   - Keep reset functions isolated to the central utility

### 3.4 Testing Integration
**File to create:**
- `src/api/core/testing/testAuthUtils.ts`

**Integration points:**
- Call individual reset functions as needed in tests
- Use `resetAllApis` for comprehensive test setup
- Ensure proper cleanup between tests

## Implementation Priority for Phase 3

### Step 1: Fix Repository Infrastructure (1-2 hours)
1. Update `RepositoryOptions` interface to include client parameter
2. Update `createRepository` function to accept and use client
3. Update `createTestingRepository` and other factory functions
4. Update `apiFactory.ts` to properly handle client injection

### Step 2: Update Service Functions (1 hour)
1. Add client parameter to chat message service functions
2. Update function signatures to be optional for backward compatibility
3. Use provided client or fall back to default supabase client

### Step 3: Resolve Export Conflicts (1 hour)
1. Rename all `resetApi` functions to be factory-specific
2. Create central reset utility
3. Update index.ts files to remove conflicting exports
4. Test that all imports still work correctly

### Step 4: Create Testing Integration (30 minutes)
1. Create `testAuthUtils.ts` with reset utility integration
2. Document usage patterns for tests
3. Verify all reset functions work independently

## Alternative Approaches Considered

### Option A: Namespace Exports (REJECTED)
```typescript
export const profileApi = { ...operations, resetApi };
export const organizationApi = { ...operations, resetApi };
```
**Rejected because:** Would require changing all existing imports throughout the codebase.

### Option B: Generic Reset Function (REJECTED)
```typescript
export const resetApi = (apiType: string, client: any) => { ... }
```
**Rejected because:** Type safety issues and less intuitive API.

### Option C: Factory-Specific Names (SELECTED)
```typescript
export const resetProfileApi = (client: any) => { ... }
export const resetOrganizationApi = (client: any) => { ... }
```
**Selected because:** Clear, type-safe, no conflicts, maintains backward compatibility.

## Expected Timeline

- **Step 1**: 1-2 hours (Repository infrastructure)
- **Step 2**: 1 hour (Service functions)
- **Step 3**: 1 hour (Export conflicts)
- **Step 4**: 30 minutes (Testing integration)
- **Total**: 3.5-4.5 hours

## Success Metrics

### Immediate Success
- [ ] All build errors resolved
- [ ] All API factories have working reset functions
- [ ] No export conflicts in index files
- [ ] Repository factories accept client parameter
- [ ] Service functions accept client parameter

### Long-term Success
- [ ] Tests can use authenticated API instances reliably
- [ ] Central reset utility works for comprehensive test setup
- [ ] Individual reset functions work for granular test control
- [ ] No breaking changes to existing functionality

## Risk Mitigation

### High Risk Items
- **Repository signature changes**: Maintain backward compatibility with optional parameters
- **Service function updates**: Keep existing function signatures working

### Medium Risk Items
- **Export conflicts**: Systematic renaming approach minimizes confusion
- **Type safety**: Ensure all client parameters are properly typed

### Low Risk Items
- **Performance**: Minimal impact on production code
- **User experience**: No user-facing changes

---

**Document Version**: 3.0  
**Last Updated**: 2025-05-29  
**Current Phase**: 3 (Infrastructure Updates and Conflict Resolution)  
**Next Steps**: Execute Step 1 (Repository Infrastructure Updates)
