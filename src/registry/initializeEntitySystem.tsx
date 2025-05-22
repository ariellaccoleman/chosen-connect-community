
import { entityRegistry } from './entityRegistrySystem';
import defaultRegistrations from './defaultEntityRegistrations';
import { EntityType } from '@/types/entityTypes';
import { generatePath } from 'react-router-dom';
import { APP_ROUTES } from '@/config/routes';
import { Entity } from '@/types/entity';
import { EntityTypeDefinition } from '@/types/entityRegistry';
import { logger } from '@/utils/logger';

/**
 * Initialize the entity registry system with default entity types
 */
export function initializeEntitySystem(): void {
  // Convert default registrations to EntityTypeDefinition format
  const definitions: EntityTypeDefinition[] = Object.values(defaultRegistrations).map(reg => ({
    type: reg.type,
    behavior: {
      // URL generation
      getDetailUrl: (id: string) => {
        try {
          switch (reg.type) {
            case EntityType.EVENT:
              return generatePath(APP_ROUTES.EVENT_DETAIL, { eventId: id });
              
            case EntityType.PERSON:
              return generatePath(APP_ROUTES.PROFILE_VIEW, { profileId: id });
              
            case EntityType.ORGANIZATION:
              return generatePath(APP_ROUTES.ORGANIZATION_DETAIL, { orgId: id });
              
            case EntityType.HUB:
              return generatePath(APP_ROUTES.HUB_DETAIL, { hubId: id });
              
            case EntityType.CHAT:
              return generatePath(APP_ROUTES.CHAT_CHANNEL, { channelId: id });
              
            default:
              return `${reg.defaultRoute}/${id}`;
          }
        } catch (e) {
          logger.error('Error generating entity detail URL:', e);
          return '/';
        }
      },
      getCreateUrl: () => `${reg.defaultRoute}/create`,
      getEditUrl: (id: string) => `${reg.defaultRoute}/${id}/edit`,
      getListUrl: () => reg.defaultRoute,
      
      // UI elements
      getIcon: () => reg.icon,
      getFallbackInitials: (entity: Entity) => {
        if (!entity.name) return '??';
        return reg.avatarFallback(entity.name);
      },
      
      // Display formatting
      getTypeLabel: () => reg.label,
      getSingularName: () => reg.label,
      getPluralName: () => reg.pluralLabel || `${reg.label}s`,
      getDisplayName: (entity: Entity) => entity.name || 'Unnamed',
      formatSummary: (entity: Entity) => entity.description || ''
    },
    converter: {
      toEntity: (source: any): Entity => ({
        id: source.id,
        entityType: reg.type,
        name: source.name || (
          reg.type === EntityType.PERSON && source.first_name 
            ? `${source.first_name || ''} ${source.last_name || ''}`.trim()
            : (reg.type === EntityType.EVENT && source.title) 
              ? source.title 
              : ''
        ),
        description: source.description || source.headline || source.bio || null,
        imageUrl: source.image_url || source.avatar_url || source.logo_url || source.logo_api_url || null,
        location: source.location || null,
        created_at: source.created_at || null,
        updated_at: source.updated_at || null,
        tags: source.tags || []
      })
    }
  }));

  // Initialize the registry with the definitions
  entityRegistry.initialize(definitions);
  
  logger.info('Entity registry system initialized successfully');
}

// Export a function to get entity type definition from the registry
export function getEntityTypeDefinition(type: EntityType) {
  return entityRegistry.get(type);
}

// Export a function to get all entity types from the registry
export function getAllEntityTypes() {
  return entityRegistry.getAll();
}
