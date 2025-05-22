
import { initializeEntitySystem } from './initializeEntitySystem';
import { 
  entityRegistry, 
  isRegisteredEntityType,
  getRegisteredEntityTypes,
  isValidEntityType
} from './entityRegistrySystem';

// Re-export from the new system
export { 
  entityRegistry,
  getEntityTypeDefinition,
  getAllEntityTypes,
  initializeEntitySystem
} from './initializeEntitySystem';

export { 
  isRegisteredEntityType,
  getRegisteredEntityTypes,
  isValidEntityType
} from './entityRegistrySystem';

// Provide backward compatibility for the function name used in imports
export const isValidEntityTypeInRegistry = isValidEntityType;

// Export the initialized registry
export default entityRegistry;
