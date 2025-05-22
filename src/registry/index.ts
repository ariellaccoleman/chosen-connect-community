
import { initializeEntitySystem } from './initializeEntitySystem';
import { entityRegistry } from './entityRegistrySystem';

// Re-export from the new system
export { 
  entityRegistry,
  getEntityTypeDefinition,
  getAllEntityTypes 
} from './initializeEntitySystem';

export { 
  isRegisteredEntityType,
  getRegisteredEntityTypes
} from './entityRegistrySystem';

// Initialize the registry on module import
initializeEntitySystem();

// Export the initialized registry
export default entityRegistry;
