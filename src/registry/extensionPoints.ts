
import { EntityType } from "@/types/entityTypes";
import { EntityTypeDefinition } from "@/types/entityRegistry";
import { entityRegistry } from "./entityRegistry";

export interface EntityTypeExtension {
  type: EntityType;
  definition: EntityTypeDefinition;
}

// Registry for extensions
class ExtensionRegistry {
  // Register a new entity type extension
  registerEntityType(extension: EntityTypeExtension): void {
    // Register with main registry
    entityRegistry.register(extension.definition);
    console.log(`Entity type extension registered: ${extension.type}`);
  }
}

// Export singleton instance
export const extensionRegistry = new ExtensionRegistry();
