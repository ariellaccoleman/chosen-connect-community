
/**
 * Enum for entity types supported by the application
 * This centralizes all entity type definitions to make adding new types easier
 */
export enum EntityType {
  PERSON = "person",
  ORGANIZATION = "organization",
  EVENT = "event",
  // Future types that can be uncommented when implemented
  // POST = "post",
}

/**
 * Type guard to check if a string is a valid EntityType
 */
export function isValidEntityType(type: string): type is EntityType {
  return Object.values(EntityType).includes(type as EntityType);
}

/**
 * @deprecated Use entityRegistry.getEntityTypeDefinition(type).behavior.getTypeLabel() instead
 * Get a display name for an entity type
 */
export function getEntityTypeDisplay(type: EntityType): string {
  // Import dynamically to prevent circular dependency
  const { getEntityTypeDefinition } = require("@/registry");
  const definition = getEntityTypeDefinition(type);
  if (definition) {
    return definition.behavior.getTypeLabel();
  }

  switch (type) {
    case EntityType.PERSON:
      return "Person";
    case EntityType.ORGANIZATION:
      return "Organization";
    case EntityType.EVENT:
      return "Event";
    default:
      return type;
  }
}

/**
 * @deprecated Use entityRegistry.getEntityTypeDefinition(type).behavior.getSingularName() instead
 * Get the singular form of an entity type name
 */
export function getEntityTypeSingular(type: EntityType): string {
  // Import dynamically to prevent circular dependency
  const { getEntityTypeDefinition } = require("@/registry");
  const definition = getEntityTypeDefinition(type);
  if (definition) {
    return definition.behavior.getSingularName();
  }

  switch (type) {
    case EntityType.PERSON:
      return "person";
    case EntityType.ORGANIZATION:
      return "organization";
    case EntityType.EVENT:
      return "event";
    default:
      return type;
  }
}

/**
 * @deprecated Use entityRegistry.getEntityTypeDefinition(type).behavior.getPluralName() instead
 * Get the plural form of an entity type name
 */
export function getEntityTypePlural(type: EntityType): string {
  // Import dynamically to prevent circular dependency
  const { getEntityTypeDefinition } = require("@/registry");
  const definition = getEntityTypeDefinition(type);
  if (definition) {
    return definition.behavior.getPluralName();
  }

  switch (type) {
    case EntityType.PERSON:
      return "people";
    case EntityType.ORGANIZATION:
      return "organizations";
    case EntityType.EVENT:
      return "events";
    default:
      return `${type}s`;
  }
}
