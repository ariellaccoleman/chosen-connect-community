
/**
 * Enum for entity types
 */
export enum EntityType {
  PERSON = 'person',
  ORGANIZATION = 'organization',
  EVENT = 'event',
  GUIDE = 'guide',
  CHAT = 'chat',
  HUB = 'hub',
  POST = 'post'
}

/**
 * Type for target type used in tag assignments - must match EntityType
 */
export type TargetType = 'person' | 'organization' | 'event' | 'guide' | 'chat' | 'hub' | 'post';

/**
 * Function to check if a string is a valid EntityType
 */
export function isValidEntityType(type: string | EntityType): boolean {
  if (typeof type === 'string') {
    return Object.values(EntityType).includes(type as EntityType) || 
           Object.values(EntityType).map(t => t.toString()).includes(type);
  }
  return Object.values(EntityType).includes(type);
}
