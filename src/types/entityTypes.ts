
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
 * Get a display name for an entity type
 */
export function getEntityTypeDisplay(type: EntityType): string {
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
 * Get the singular form of an entity type name
 */
export function getEntityTypeSingular(type: EntityType): string {
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
 * Get the plural form of an entity type name
 */
export function getEntityTypePlural(type: EntityType): string {
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
