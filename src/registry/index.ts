
import defaultRegistrations from "./defaultEntityRegistrations";
import { entityRegistry } from "./entityRegistry";
import { EntityType } from "@/types/entityTypes";

// Initialize the registry with default registrations
export function initializeRegistry(): void {
  // Register each default entity type in the registry
  Object.values(defaultRegistrations).forEach(registration => {
    entityRegistry.register({
      type: registration.type,
      behavior: {
        getDetailUrl: (id) => `${registration.defaultRoute}/${id}`,
        getCreateUrl: () => `${registration.defaultRoute}/create`,
        getEditUrl: (id) => `${registration.defaultRoute}/${id}/edit`,
        getListUrl: () => registration.defaultRoute,
        getIcon: () => registration.icon,
        getFallbackInitials: (entity) => entity.name?.charAt(0) || '?',
        getTypeLabel: () => registration.label,
        getSingularName: () => registration.label,
        getPluralName: () => registration.pluralLabel || `${registration.label}s`,
        getDisplayName: (entity) => entity.name || 'Unnamed',
        formatSummary: (entity) => entity.description || ''
      },
      converter: {
        toEntity: (source) => ({
          id: source.id,
          entityType: registration.type,
          name: source.name || '',
          created_at: source.created_at
        })
      }
    });
  }); 
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
