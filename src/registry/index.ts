
import { initializeDefaultEntityRegistrations } from "./defaultEntityRegistrations";
import { entityRegistry } from "./entityRegistry";
import { EntityType } from "@/types/entityTypes";

// Initialize the registry with default registrations
export function initializeRegistry(): void {
  initializeDefaultEntityRegistrations();
}

// Re-export the registry
export { entityRegistry };

// Export helper functions that use the registry
export function getEntityTypeDefinition(type: EntityType) {
  return entityRegistry.get(type);
}

export function getAllEntityTypes() {
  return entityRegistry.getAll();
}
