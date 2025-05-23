
# Schema-Based Repository Migration

This document outlines the migration from mock-based testing to schema-based testing with Supabase.

## Migration Plan

1. Update `SupabaseRepository` to handle schema selection directly
   - Add schema parameter to constructor with 'public' as default
   - Apply the schema to all database operations

2. Update repository factory functions
   - Accept optional schema parameter
   - Pass schema to SupabaseRepository when created

3. Create testing-specific factory functions
   - Create functions that automatically use the 'testing' schema
   - Maintain fallback to mock repositories when Supabase is not available

4. Remove redundant `SchemaAwareRepository` class
   - Eliminate unnecessary wrapper class
   - Move any unique functionality to `SupabaseRepository`

5. Update entity-specific repositories
   - Ensure entity repositories use the new factory pattern
   - Keep domain-specific operations

6. Update testing utilities
   - Simplify test setup to use schema parameter

## Benefits

- Simplified repository architecture
- More realistic testing with actual database schema
- Less code duplication between production and test environments
- Clearer separation between repository implementation and domain logic

## Implementation Progress

- [ ] Update SupabaseRepository
- [ ] Update repository factory functions
- [ ] Create testing-specific factory functions
- [ ] Remove SchemaAwareRepository
- [ ] Update entity repositories
- [ ] Update testing utilities
- [ ] Update API tests
