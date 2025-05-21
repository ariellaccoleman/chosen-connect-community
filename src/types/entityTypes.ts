
/**
 * Enum for entity types
 */
export enum EntityType {
  PERSON = 'person',
  ORGANIZATION = 'organization',
  EVENT = 'event',
  GUIDE = 'guide',
  CHAT = 'chat',
  HUB = 'hub'
}

/**
 * Type for target type used in tag assignments - must match EntityType
 */
export type TargetType = 'person' | 'organization' | 'event' | 'guide' | 'chat' | 'hub';
