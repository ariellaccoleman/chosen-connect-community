
import { Entity, EntityBase } from './entityRegistry';
import { Event } from './event';
import { Organization } from './organization';
import { Profile } from './profile';
import { Hub } from './hub';
import { EntityType } from './entityTypes';

/**
 * Base entity properties all entity types share
 */
export interface BaseEntity {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Convert a profile to a generic entity
 */
export const profileToEntity = (profile: Profile): Entity => {
  return {
    id: profile.id || '',
    type: EntityType.PERSON,
    name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
    description: profile.bio || '',
    imageUrl: profile.avatar_url || '',
    url: `/profile/${profile.id}`,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    data: profile,
  };
};

/**
 * Convert an organization to a generic entity
 */
export const organizationToEntity = (org: Organization): Entity => {
  return {
    id: org.id || '',
    type: EntityType.ORGANIZATION,
    name: org.name || '',
    description: org.description || '',
    imageUrl: org.logo_url || '',
    url: `/organizations/${org.id}`,
    createdAt: org.created_at,
    updatedAt: org.updated_at,
    data: org,
  };
};

/**
 * Convert an event to a generic entity
 */
export const eventToEntity = (event: Event): Entity => {
  return {
    id: event.id || '',
    type: EntityType.EVENT,
    name: event.title || '',
    description: event.description || '',
    imageUrl: event.image_url || '',
    url: `/events/${event.id}`,
    createdAt: event.created_at,
    updatedAt: event.updated_at,
    data: event,
  };
};

/**
 * Convert a hub to a generic entity
 */
export const hubToEntity = (hub: Hub): Entity => {
  return {
    id: hub.id || '',
    type: EntityType.HUB,
    name: hub.name || '',
    description: hub.description || '',
    imageUrl: hub.image_url || '',
    url: `/hubs/${hub.id}`,
    createdAt: hub.created_at,
    updatedAt: hub.updated_at,
    data: hub,
  };
};

/**
 * Generic function to convert any supported entity type to a unified Entity object
 */
export const toEntity = (item: any, type: EntityType): Entity => {
  switch (type) {
    case EntityType.PERSON:
      return profileToEntity(item);
    case EntityType.ORGANIZATION:
      return organizationToEntity(item);
    case EntityType.EVENT:
      return eventToEntity(item);
    case EntityType.HUB:
      return hubToEntity(item);
    default:
      throw new Error(`Unsupported entity type: ${type}`);
  }
};
