
# Entity Registry System

The Entity Registry system provides a unified way to work with different entity types in the application. 
It allows for consistent handling of entities across the application and makes it easier to add new entity types.

## Core Components

- `EntityRegistry`: The central registry that manages entity type definitions
- `EntityTypeDefinition`: Defines what an entity type is and how it behaves
- `EntityConverter`: Handles conversion between domain objects and the generic Entity interface
- `EntityBehavior`: Defines how an entity type behaves in the UI and application logic

## How to Use the Registry

### Getting Entity Information

Use the `useEntityRegistry` hook to access the registry in components:

```tsx
import { useEntityRegistry } from '@/hooks/useEntityRegistry';
import { EntityType } from '@/types/entityTypes';

function MyComponent() {
  const { 
    getEntityUrl, 
    getEntityIcon,
    getEntityTypeLabel 
  } = useEntityRegistry();
  
  // Get URL for entity detail page
  const detailUrl = getEntityUrl(someEntity);
  
  // Get icon component for an entity type
  const icon = getEntityIcon(EntityType.PERSON);
  
  // Get display label for an entity type
  const label = getEntityTypeLabel(EntityType.ORGANIZATION);
  
  return <div>...</div>;
}
```

### Converting Domain Objects to Entities

```tsx
import { useEntityRegistry } from '@/hooks/useEntityRegistry';
import { EntityType } from '@/types/entityTypes';

function MyComponent() {
  const { toEntity } = useEntityRegistry();
  
  // Convert a profile to an entity
  const entity = toEntity(profile, EntityType.PERSON);
  
  return <div>...</div>;
}
```

## Registering a New Entity Type

To add a new entity type:

1. Update the `EntityType` enum in `src/types/entityTypes.ts`
2. Create converters for the new entity type
3. Register the new entity type using the registry:

```tsx
import { entityRegistry } from '@/registry';
import { EntityType } from '@/types/entityTypes';

// Register a new entity type
entityRegistry.register({
  type: EntityType.CUSTOM_TYPE,
  converter: {
    toEntity: customObjectToEntity
  },
  behavior: {
    getDetailUrl: (id) => `/custom/${id}`,
    getCreateUrl: () => '/custom/new',
    getEditUrl: (id) => `/custom/${id}/edit`,
    getListUrl: () => '/custom',
    getIcon: () => <CustomIcon className="h-4 w-4" />,
    getTypeLabel: () => "Custom",
    getSingularName: () => "custom",
    getPluralName: () => "customs",
    getDisplayName: (entity) => entity.name,
    getFallbackInitials: (entity) => {
      if (!entity.name) return "?";
      return entity.name.substring(0, 2).toUpperCase();
    }
  }
});
```

## Integration with Repository Pattern

The entity registry works alongside the repository pattern:

```tsx
import { useEntityRegistry } from '@/hooks/useEntityRegistry';
import { useProfileById } from '@/hooks/profiles';
import { EntityType } from '@/types/entityTypes';

function ProfileEntityCard({ profileId }) {
  const { toEntity } = useEntityRegistry();
  const { data: profile } = useProfileById(profileId);
  
  if (!profile) return <Skeleton />;
  
  // Convert domain object to entity
  const entity = toEntity(profile, EntityType.PERSON);
  
  return <EntityCard entity={entity} />;
}
```

## Testing with Mock Entities

When testing components that use the entity registry:

```tsx
import { createMockDataGenerator } from '@/api/core/testing/mockDataGenerator';

const mockProfileGenerator = createMockDataGenerator<Profile>('profile');
const mockProfiles = mockProfileGenerator.generateMany(5);

test('EntityCard should render a profile entity', () => {
  const profile = mockProfiles[0];
  const { toEntity } = entityRegistry;
  
  const entity = toEntity(profile, EntityType.PERSON);
  
  render(<EntityCard entity={entity} />);
  // Assert component renders correctly
});
```
