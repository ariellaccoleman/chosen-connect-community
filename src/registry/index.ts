
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
  getAllEntityTypes 
} from './initializeEntitySystem';

export { 
  isRegisteredEntityType,
  getRegisteredEntityTypes,
  isValidEntityType
} from './entityRegistrySystem';

// Create an alias for the function name used in imports
export const isValidEntityTypeInRegistry = isValidEntityType;

// Provide backward compatibility for the initialization function
export const initializeRegistry = initializeEntitySystem;

// Initialize the registry on module import
initializeEntitySystem();

// Export the initialized registry
export default entityRegistry;
