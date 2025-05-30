
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

### 3. Client-Aware Repository Wrapper Problem
- **Issue**: `createClientAwareRepository` in `apiFactory.ts` bypasses the repository pattern
- **Impact**: Makes direct Supabase client calls instead of using proper repositories
- **Result**: Defeats the purpose of having repositories and prevents proper client flow

## Implementation Status

### Phase 1: Core Infrastructure (COMPLETE)
✅ **Update core repository factories** - Added client parameter support to `createRepository` functions

### Phase 2: API Factory Updates (COMPLETE)
✅ **Added reset functions to API factories** - All major API factories now have `resetApi(client)` functions

### Phase 3: Export Conflict Resolution (COMPLETE)
✅ **Renamed factory reset functions** to be factory-specific:
- `postsApiFactory.ts` → `resetPostsApi(client)`
- `chatMessageApiFactory.ts` → `resetChatMessageApi(client)`
- `organizationApiFactory.ts` → `resetOrganizationApi(client)`
- `profileApiFactory.ts` → `resetProfileApi(client)`

✅ **Service function updates** - All service functions now accept client parameters

## Current Status Analysis

### What Works:
- ✅ Export conflicts are resolved with factory-specific reset function names
- ✅ Service functions (chat message service) accept client parameters  
- ✅ Repository factory functions accept client parameters
- ✅ SupabaseRepository constructor accepts client parameters
- ✅ All major API factories have reset functions

### Critical Issue Identified:
**The `createClientAwareRepository` function** in `apiFactory.ts` (lines 58-130) is a problematic implementation that:
- Bypasses the entire repository pattern
- Makes direct Supabase client calls
- Creates a fake "repository-like interface"
- Prevents the client parameter from flowing through the proper repository chain

### The Real Problem:
The issue is not that repositories don't support client parameters - they do! The problem is that `createApiFactory` uses this terrible wrapper instead of passing the client to the real `createRepository` function.

## Revised Implementation Plan

### Phase 4: Remove Client-Aware Repository Wrapper (CURRENT PRIORITY)

**Objective**: Delete the problematic wrapper and restore proper repository pattern

**Critical Changes Needed:**
1. **Delete `createClientAwareRepository` function** from `apiFactory.ts` (lines 58-130)
2. **Update `createApiFactory`** to pass `providedClient` directly to `createRepository` calls
3. **Remove all calls** to `createClientAwareRepository` 
4. **Use the real repository pattern** that already supports client parameters

**The Fix:**
Instead of:
```typescript
const clientAwareRepository = createClientAwareRepository(dataRepository, tableName, providedClient);
```

Use:
```typescript
const dataRepository = createRepository<T>(tableName, { schema: 'public' }, providedClient);
```

### Phase 5: Verify Repository Chain Works

**Objective**: Ensure client parameters flow through the entire repository chain

**Verification Steps:**
1. **Verify the complete chain**: `resetApi(client)` → `createApiFactory(client)` → `createRepository(client)` → `SupabaseRepository(client)`
2. **Test reset functions** work with authenticated clients
3. **Confirm no functionality is lost**

### Phase 6: Create Testing Integration

**Objective**: Build the testing utilities that were never created

**Files to Create:**
- `src/api/core/testing/testAuthUtils.ts` - Central reset utility integration
- Documentation for usage patterns in tests

**Integration Points:**
- Call individual reset functions as needed in tests
- Use centralized utility for comprehensive test setup
- Ensure proper cleanup between tests

## What We DON'T Need to Do

The following items are already complete and working correctly:
- ✅ Repository factory functions accept client parameter
- ✅ SupabaseRepository accepts client parameter  
- ✅ Service functions accept client parameter
- ✅ Export conflicts are resolved
- ✅ Reset functions exist for all major APIs

## Success Metrics

### Immediate Success
- [ ] `createClientAwareRepository` function removed
- [ ] `createApiFactory` passes client to real `createRepository`
- [ ] All reset functions work with authenticated clients
- [ ] No build errors or functionality loss

### Long-term Success
- [ ] Tests can use authenticated API instances reliably
- [ ] Repository pattern is properly maintained
- [ ] Client parameters flow correctly through the entire chain
- [ ] Testing utilities support both individual and comprehensive reset scenarios

## Risk Mitigation

### High Risk Items
- **Repository pattern integrity**: Ensure removing the wrapper doesn't break existing functionality
- **Client parameter flow**: Verify the entire chain works after the fix

### Medium Risk Items
- **Type safety**: Ensure all client parameters are properly typed
- **Error handling**: Maintain proper error handling through the repository layer

### Low Risk Items
- **Performance**: Minimal impact on production code
- **User experience**: No user-facing changes

---

**Document Version**: 4.0  
**Last Updated**: 2025-05-30  
**Current Phase**: 4 (Remove Client-Aware Repository Wrapper)  
**Next Steps**: Delete the problematic wrapper and restore proper repository pattern
