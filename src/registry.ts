
import { EntityType } from "./types/entityTypes";

/**
 * Global registry for entity types and their relationships
 * This helps centralize entity type config and prevents hardcoding
 */
export interface EntityRegistry {
  entityTypes: Record<string, boolean>;
  initialized: boolean;
}

// Create the registry singleton
const entityRegistry: EntityRegistry = {
  entityTypes: {},
  initialized: false
};

/**
 * Initialize entity registry with all valid entity types
 */
export const initializeRegistry = (): void => {
  if (entityRegistry.initialized) {
    return;
  }

  // Register all valid entity types from the EntityType enum
  Object.values(EntityType).forEach(type => {
    entityRegistry.entityTypes[type] = true;
  });

  entityRegistry.initialized = true;
  console.log("Entity registry initialized with types:", Object.keys(entityRegistry.entityTypes));
};

/**
 * Check if an entity type is valid
 */
export const isValidEntityTypeInRegistry = (type: string): boolean => {
  if (!entityRegistry.initialized) {
    initializeRegistry();
  }
  
  return !!entityRegistry.entityTypes[type];
};

/**
 * Get all registered entity types
 */
export const getRegisteredEntityTypes = (): string[] => {
  if (!entityRegistry.initialized) {
    initializeRegistry();
  }
  
  return Object.keys(entityRegistry.entityTypes);
};

export default entityRegistry;
