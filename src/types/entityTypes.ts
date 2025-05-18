
/**
 * Entity types supported in the application
 */
export enum EntityType {
  PERSON = 'person',
  ORGANIZATION = 'organization',
  EVENT = 'event',
  CHAT = 'chat'  // Add new chat entity type
}

/**
 * Validate if a string is a valid EntityType
 */
export function isValidEntityType(type: any): boolean {
  if (typeof type === 'string') {
    return Object.values(EntityType).includes(type as EntityType);
  }
  return false;
}
