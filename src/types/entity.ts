/**
 * Entity interface
 * Represents a common interface for different entity types
 */

import { EntityType } from './entityTypes';
import { Post } from './post';

/**
 * Entity interface
 * Represents a common interface for different entity types
 */
export interface Entity {
  id: string;
  entityType: EntityType;
  name: string;
  description?: string;
  location?: string;
  imageUrl?: string | null;
  tags?: string[];
  created_at?: string;
}

/**
 * Convert a data object to an entity
 */
export const toEntity = (data: any, entityType: EntityType): Entity | null => {
  if (!data) return null;
  
  const baseEntity: Entity = {
    id: data.id,
    entityType,
    name: '',
    created_at: data.created_at,
  };
  
  switch (entityType) {
    case EntityType.EVENT:
      return {
        ...baseEntity,
        name: data.title,
        description: data.description,
        location: data.location,
        imageUrl: data.image_url || null,
        tags: data.tags,
      };
    
    case EntityType.PERSON:
      return {
        ...baseEntity,
        name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        description: data.headline || data.bio,
        location: data.location,
        imageUrl: data.avatar_url || null,
        tags: data.tags,
      };
      
    case EntityType.ORGANIZATION:
      return {
        ...baseEntity,
        name: data.name,
        description: data.description,
        location: data.location,
        imageUrl: data.logo_url || data.logo_api_url || null,
        tags: data.tags,
      };
      
    case EntityType.HUB:
      return {
        ...baseEntity,
        name: data.name,
        description: data.description,
        imageUrl: null, // Hubs don't have images currently
        tags: data.tags,
      };
      
    case EntityType.POST:
      return {
        ...baseEntity,
        name: `Post by ${data.author?.first_name || 'Unknown'} ${data.author?.last_name || ''}`.trim(),
        description: data.content,
        imageUrl: data.media && data.media.length > 0 ? 
          data.media.find(m => m.media_type === 'image')?.url || null : null,
        tags: data.tags,
      };
      
    default:
      return null;
  }
};
