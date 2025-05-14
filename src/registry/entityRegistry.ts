
import { EntityType } from "../types/entityTypes";
import { EntityTypeDefinition } from "../types/entityRegistry";

class EntityRegistry {
  private registry: Map<EntityType, EntityTypeDefinition> = new Map();
  
  // Register a new entity type
  register(definition: EntityTypeDefinition): void {
    this.registry.set(definition.type, definition);
  }
  
  // Get a registered entity type definition
  get(type: EntityType): EntityTypeDefinition | undefined {
    return this.registry.get(type);
  }
  
  // Get all registered entity types
  getAll(): EntityTypeDefinition[] {
    return Array.from(this.registry.values());
  }
  
  // Helper method to check if an entity type is registered
  has(type: EntityType): boolean {
    return this.registry.has(type);
  }
}

// Create and export singleton instance
export const entityRegistry = new EntityRegistry();
