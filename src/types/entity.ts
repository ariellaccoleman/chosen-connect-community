
import { EntityType } from "./entityTypes";
import { LocationWithDetails } from "./location";
import { ProfileWithDetails } from "./profile";
import { OrganizationWithLocation } from "./organization";
import { EventWithDetails } from "./event";
import { TagAssignment } from "@/utils/tags/types";
import { ChatChannelWithDetails } from './chat';
import { HubWithDetails } from "./hub";

/**
 * Base entity interface that all entity types should implement
 */
export interface BaseEntity {
  id: string;
  created_at?: string;
  updated_at?: string;
  tags?: TagAssignment[];
}

/**
 * Interface for generic entity data with additional metadata
 */
export interface Entity extends BaseEntity {
  entityType: EntityType;
  name: string;
  description?: string;
  imageUrl?: string | null;
  location?: LocationWithDetails | null;
  url?: string | null;
}

/**
 * Convert a ProfileWithDetails to the generic Entity interface
 */
export function profileToEntity(profile: ProfileWithDetails): Entity {
  return {
    id: profile.id,
    entityType: EntityType.PERSON,
    name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
    description: profile.bio || undefined,
    imageUrl: profile.avatar_url,
    location: profile.location,
    url: profile.website_url || undefined,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    tags: profile.tags
  };
}

/**
 * Convert an OrganizationWithLocation to the generic Entity interface
 */
export function organizationToEntity(organization: OrganizationWithLocation): Entity {
  return {
    id: organization.id,
    entityType: EntityType.ORGANIZATION,
    name: organization.name,
    description: organization.description || undefined,
    imageUrl: organization.logo_url,
    location: organization.location,
    url: organization.website_url || undefined,
    created_at: organization.created_at,
    updated_at: organization.updated_at,
    tags: organization.tags
  };
}

/**
 * Convert an EventWithDetails to the generic Entity interface
 */
export function eventToEntity(event: EventWithDetails): Entity {
  return {
    id: event.id,
    entityType: EntityType.EVENT,
    name: event.title || '',
    description: event.description || undefined,
    location: event.location,
    created_at: event.created_at,
    updated_at: event.updated_at,
    tags: event.tags
  };
}

/**
 * Convert a chat channel to an entity
 */
export function chatChannelToEntity(channel: ChatChannelWithDetails): Entity {
  return {
    id: channel.id,
    name: channel.name || 'Unnamed Channel',
    description: channel.channel_type || 'group',
    imageUrl: null,
    entityType: EntityType.CHAT,
    created_at: channel.created_at,
    updated_at: channel.updated_at,
    tags: channel.tag_assignments
  };
}

/**
 * Convert a hub to an entity
 */
export function hubToEntity(hub: HubWithDetails): Entity {
  return {
    id: hub.id,
    name: hub.name,
    description: hub.description || undefined,
    imageUrl: null, // Hubs don't have images yet
    entityType: EntityType.HUB,
    created_at: hub.created_at,
    updated_at: hub.updated_at,
    tags: hub.tag ? [{ 
      id: '', 
      tag_id: hub.tag.id, 
      target_id: hub.id, 
      target_type: 'hub', 
      created_at: hub.created_at || '', 
      tag: hub.tag 
    }] : []
  };
}

/**
 * @deprecated Use the entity registry's toEntity method instead
 * Convert an entity of any type to the generic Entity interface
 */
export function toEntity(entity: any, entityType: EntityType): Entity | null {
  // Import dynamically to prevent circular dependency
  const { useEntityRegistry } = require("@/hooks/useEntityRegistry");
  const { toEntity } = useEntityRegistry();
  return toEntity(entity, entityType);
}
