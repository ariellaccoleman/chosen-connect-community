
import { useQuery } from '@tanstack/react-query';
import { Entity } from '@/types/entity';
import { EntityType } from '@/types/entityTypes';
import { profileApi } from '@/api/profiles';
import { organizationApi } from '@/api/organizations';
import { eventApi } from '@/api/events';
import { logger } from '@/utils/logger';
import { ProfileWithDetails } from '@/types';
import { OrganizationWithLocation } from '@/types/organization';
import { EventWithDetails } from '@/types/event';

interface EntityFeedParams {
  entityTypes?: EntityType[];
  limit?: number;
  tagId?: string | null;
  search?: string;
  isApproved?: boolean;
  // Pagination params
  currentPage?: number;
  itemsPerPage?: number;
}

// Helper function to convert profile to entity
const profileToEntity = (profile: ProfileWithDetails): Entity => ({
  id: profile.id,
  entityType: EntityType.PERSON,
  name: `${profile.first_name} ${profile.last_name}`,
  description: profile.headline,
  imageUrl: profile.avatar_url || undefined,
  location: profile.location,
  url: profile.website_url || undefined,
  created_at: profile.created_at,
  updated_at: profile.updated_at,
  tags: profile.tags
});

// Helper function to convert organization to entity
const organizationToEntity = (org: OrganizationWithLocation): Entity => ({
  id: org.id,
  entityType: EntityType.ORGANIZATION,
  name: org.name,
  description: org.description,
  imageUrl: org.logo_url || undefined,
  location: org.location,
  url: org.website_url || undefined,
  created_at: org.created_at,
  updated_at: org.updated_at,
  tags: org.tags
});

// Helper function to convert event to entity
const eventToEntity = (event: EventWithDetails): Entity => ({
  id: event.id,
  entityType: EntityType.EVENT,
  name: event.title,
  description: event.description,
  location: event.location,
  created_at: event.created_at,
  updated_at: event.updated_at,
  tags: event.tags
});

/**
 * Hook for fetching entities with filtering options
 */
export const useEntityFeed = (params: EntityFeedParams = {}) => {
  const {
    entityTypes = [EntityType.PERSON, EntityType.ORGANIZATION, EntityType.EVENT],
    limit,
    tagId,
    search = "",
    isApproved = true,
    currentPage = 1,
    itemsPerPage = 12
  } = params;

  // Validate entity types
  const validEntityTypes = entityTypes.filter(type => 
    Object.values(EntityType).includes(type)
  );

  if (validEntityTypes.length !== entityTypes.length) {
    logger.warn('Some invalid entity types were filtered out:', entityTypes);
  }

  const queryKey = ['entity-feed', {
    entityTypes: validEntityTypes.sort(),
    limit,
    tagId,
    search,
    isApproved,
    currentPage,
    itemsPerPage
  }];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const allEntities: Entity[] = [];
        let totalCount = 0;

        logger.debug(`EntityFeed: Fetching entities for types: ${validEntityTypes.join(', ')}`);

        for (const entityType of validEntityTypes) {
          try {
            let entities: Entity[] = [];
            let count = 0;

            switch (entityType) {
              case EntityType.PERSON:
                const profilesResult = await profileApi.getAll({
                  filters: {
                    ...(isApproved !== false && { is_approved: true }),
                  },
                  search,
                  query: `*, tags:tag_assignments(*, tag:tags(*))`
                });

                if (profilesResult.error) {
                  logger.error(`Error fetching profiles:`, profilesResult.error);
                  break;
                }

                entities = (profilesResult.data || []).map(profileToEntity);
                count = profilesResult.data?.length || 0;
                break;

              case EntityType.ORGANIZATION:
                const orgsResult = await organizationApi.getAll({
                  search,
                  query: `*, tags:tag_assignments(*, tag:tags(*))`
                });

                if (orgsResult.error) {
                  logger.error(`Error fetching organizations:`, orgsResult.error);
                  break;
                }

                entities = (orgsResult.data || []).map(organizationToEntity);
                count = orgsResult.data?.length || 0;
                break;

              case EntityType.EVENT:
                const eventsResult = await eventApi.getAll({
                  search,
                  query: `*, tags:tag_assignments(*, tag:tags(*)), host:profiles(*), location:locations(*)`
                });

                if (eventsResult.error) {
                  logger.error(`Error fetching events:`, eventsResult.error);
                  break;
                }

                entities = (eventsResult.data || []).map(eventToEntity);
                count = eventsResult.data?.length || 0;
                break;
            }

            // Apply tag filtering if specified
            if (tagId && entities.length > 0) {
              entities = entities.filter(entity => 
                entity.tags && entity.tags.some(assignment => 
                  assignment.tag_id === tagId
                )
              );
            }

            allEntities.push(...entities);
            totalCount += count;

          } catch (error) {
            logger.error(`Error processing ${entityType}:`, error);
          }
        }

        // Sort by creation date (newest first)
        allEntities.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB.getTime() - dateA.getTime();
        });

        logger.debug(`EntityFeed: Returning ${allEntities.length} entities total`);

        // For now, we'll handle pagination client-side since we're aggregating from multiple sources
        // In a real production app, you'd want server-side pagination with proper counts
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedEntities = allEntities.slice(startIndex, endIndex);

        return {
          entities: paginatedEntities,
          totalCount: allEntities.length,
          allEntities: allEntities // Keep all for accurate total count
        };

      } catch (error) {
        logger.error('EntityFeed error:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    entities: query.data?.entities || [],
    totalCount: query.data?.totalCount || 0,
    isLoading: query.isLoading,
    error: query.error
  };
};
