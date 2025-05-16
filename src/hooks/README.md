
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
├── tag/                     # Tag mutation hooks
├── tags/                    # Tag query hooks
└── tests/                   # Test-related hooks
```

## Usage Guidelines

### Preferred Import Patterns

Always import hooks from the specific module directly:

```typescript
// Preferred
import { useOrganizations } from '@/hooks/organizations';
import { useCurrentProfile } from '@/hooks/profiles';
import { useLocationSearch } from '@/hooks/locations';

// Avoid (legacy pattern)
import { useProfiles } from '@/hooks';
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

## Migration Plan

All files that re-export functionality from other modules (for backward compatibility) will be removed in future versions. Please update your imports to use the modular structure directly.

### Timeline

- **Current version**: Deprecated hooks are marked with JSDoc @deprecated tags
- **Next major version**: Console warnings will be added for deprecated imports
- **Following major version**: Deprecated modules will be removed completely
