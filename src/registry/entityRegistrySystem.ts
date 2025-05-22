
import { ReactNode } from "react";
import { Entity } from "@/types/entity";
import { EntityType } from "@/types/entityTypes";
import { EntityTypeDefinition, EntityBehavior, EntityConverter } from "@/types/entityRegistry";
import { logger } from "@/utils/logger";

/**
 * Core entity registry that provides a centralized system for entity type registration
 * and operations. This combines the functionality of both previous registry implementations.
 */
class EntityRegistrySystem {
  private registry: Map<EntityType, EntityTypeDefinition> = new Map();
  private initialized: boolean = false;
  
  /**
   * Register a new entity type definition
   */
  register(definition: EntityTypeDefinition): void {
    if (this.registry.has(definition.type)) {
      logger.warn(`Entity type ${definition.type} is already registered. Overwriting.`);
    }
    this.registry.set(definition.type, definition);
    logger.debug(`Registered entity type: ${definition.type}`);
  }
  
  /**
   * Get a registered entity type definition
   */
  get(type: EntityType): EntityTypeDefinition | undefined {
    const definition = this.registry.get(type);
    if (!definition) {
      logger.warn(`Entity type ${type} is not registered`);
    }
    return definition;
  }
  
  /**
   * Get all registered entity types definitions
   */
  getAll(): EntityTypeDefinition[] {
    return Array.from(this.registry.values());
  }
  
  /**
   * Get all registered entity type names
   */
  getAllTypes(): EntityType[] {
    return Array.from(this.registry.keys());
  }
  
  /**
   * Check if an entity type is registered
   */
  has(type: EntityType | string): boolean {
    return this.registry.has(type as EntityType);
  }
  
  /**
   * Initialize the registry with default entity types
   */
  initialize(initialDefinitions: EntityTypeDefinition[]): void {
    if (this.initialized) {
      logger.warn('Entity registry is already initialized');
      return;
    }
    
    initialDefinitions.forEach(def => this.register(def));
    this.initialized = true;
    logger.info(`Entity registry initialized with ${initialDefinitions.length} entity types`);
  }
  
  /**
   * Convert a raw data object to an entity
   */
  toEntity<T>(data: T, entityType: EntityType): Entity | null {
    const definition = this.get(entityType);
    if (!definition) {
      logger.error(`Cannot convert to entity: No definition for type ${entityType}`);
      return null;
    }
    
    try {
      return definition.converter.toEntity(data);
    } catch (error) {
      logger.error(`Error converting ${entityType} to entity:`, error);
      return null;
    }
  }
  
  /**
   * Get the URL for an entity
   */
  getEntityUrl(entity: Entity): string {
    if (!entity || !entity.entityType) {
      logger.warn('Invalid entity or missing entity type');
      return '/';
    }
    
    const definition = this.get(entity.entityType);
    if (!definition) {
      logger.error(`No entity definition found for type: ${entity.entityType}`);
      return '/';
    }
    
    try {
      return definition.behavior.getDetailUrl(entity.id);
    } catch (error) {
      logger.error(`Error generating URL for entity ${entity.id} of type ${entity.entityType}:`, error);
      return '/';
    }
  }
  
  /**
   * Get the icon for an entity type
   */
  getEntityIcon(entityType: EntityType): ReactNode | null {
    const definition = this.get(entityType);
    if (!definition) {
      logger.error(`No entity definition found for type: ${entityType}`);
      return null;
    }
    
    return definition.behavior.getIcon();
  }
  
  /**
   * Get the label for an entity type
   */
  getEntityTypeLabel(entityType: EntityType): string {
    const definition = this.get(entityType);
    if (!definition) {
      logger.error(`No entity definition found for type: ${entityType}`);
      return 'Unknown';
    }
    
    return definition.behavior.getTypeLabel();
  }
  
  /**
   * Get the plural label for an entity type
   */
  getEntityTypePlural(entityType: EntityType): string {
    const definition = this.get(entityType);
    if (!definition) {
      logger.error(`No entity definition found for type: ${entityType}`);
      return 'Unknown';
    }
    
    return definition.behavior.getPluralName();
  }
  
  /**
   * Get avatar fallback initials for an entity
   */
  getEntityAvatarFallback(entity: Entity): string {
    if (!entity || !entity.entityType) {
      return '??';
    }
    
    const definition = this.get(entity.entityType);
    if (!definition) {
      // Default fallback logic if no definition exists
      if (!entity.name) return '??';
      return entity.name
        .split(' ')
        .slice(0, 2)
        .map(word => word.charAt(0).toUpperCase())
        .join('');
    }
    
    return definition.behavior.getFallbackInitials(entity);
  }
}

// Create and export the singleton instance
export const entityRegistry = new EntityRegistrySystem();

// Re-export existing isValidEntityType from entityTypes for backward compatibility
export { isValidEntityType } from "@/types/entityTypes";

/**
 * Check if a string is a registered entity type
 */
export function isRegisteredEntityType(type: string): boolean {
  return entityRegistry.has(type);
}

/**
 * Get all registered entity type names
 */
export function getRegisteredEntityTypes(): EntityType[] {
  return entityRegistry.getAllTypes();
}

/**
 * Convert a data object to an entity
 * @deprecated Use entityRegistry.toEntity instead
 */
export function convertToEntity<T>(data: T, entityType: EntityType): Entity | null {
  return entityRegistry.toEntity(data, entityType);
}
