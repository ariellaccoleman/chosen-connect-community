
# Hooks Module Structure

This directory contains React hooks organized by domain for the application. Hooks are used to encapsulate reusable stateful logic.

## Directory Structure

```
hooks/
├── core/                    # Core hook utilities and factories
│   └── factory/             # Hook factory pattern implementation
├── events/                  # Event-related hooks
├── locations/               # Location-related hooks
├── organizations/           # Organization-related hooks
├── profiles/                # Profile-related hooks
├── tags/                    # Tag-related hooks
├── tests/                   # Test-related hooks
└── chat/                    # Chat-related hooks
```

## Usage Guidelines

### Preferred Import Patterns

Always import hooks from the specific module directly:

```typescript
// Preferred
import { useOrganizations } from '@/hooks/organizations';
import { useCurrentProfile } from '@/hooks/profiles';
import { useLocationSearch } from '@/hooks/locations';
```

### Hook Factory Pattern

The hook modules use a factory pattern to create standardized query and mutation hooks:

```typescript
// Creating hooks for a new entity type
const entityHooks = createQueryHooks(
  { name: 'entity', pluralName: 'entities' },
  entityApi
);

// Export the generated hooks
export const { 
  useEntityList, 
  useEntityById, 
  useCreateEntity 
} = entityHooks;
```

## Integration with Repository Pattern

Hooks use the repository pattern through the API factory:

```typescript
import { useQuery } from '@tanstack/react-query';
import { profileApi } from '@/api/profiles';

export function useProfileDetails(profileId: string) {
  return useQuery({
    queryKey: ['profile', profileId],
    queryFn: () => profileApi.getById(profileId)
  });
}
```

For detailed examples of API and hook factories, see the [API Factory Documentation](../api/core/factories.md).

## Testing Hooks

When testing hooks that use repositories:

```typescript
import { mockRepositoryFactory } from '@/api/core/testing/repositoryTestUtils';

// Setup
beforeEach(() => {
  mockRepositoryFactory({
    profiles: mockProfiles
  });
});

// Test the hook
test('should fetch profile data', async () => {
  const { result } = renderHook(() => useProfileDetails('123'));
  
  // Wait for query to complete
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  
  // Check result
  expect(result.current.data).toEqual(mockProfiles[0]);
});

// Cleanup
afterEach(() => {
  resetRepositoryFactoryMock();
});
```
