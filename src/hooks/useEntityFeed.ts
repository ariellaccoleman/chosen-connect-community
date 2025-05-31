import { useQuery, keepPreviousData } from '@tanstack/react-query';
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
 * Hook for fetching entities with server-side pagination and filtering
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

  logger.debug("useEntityFeed called with params:", {
    entityTypes,
    limit,
    tagId,
    search,
    isApproved,
    currentPage,
    itemsPerPage
  });

  // Validate entity types
  const validEntityTypes = entityTypes.filter(type => 
    Object.values(EntityType).includes(type)
  );

  if (validEntityTypes.length !== entityTypes.length) {
    logger.warn('Some invalid entity types were filtered out:', entityTypes);
  }

  // Calculate pagination parameters
  const offset = (currentPage - 1) * itemsPerPage;
  const actualLimit = limit || itemsPerPage;

  logger.debug("useEntityFeed pagination calculation:", {
    currentPage,
    itemsPerPage,
    offset,
    actualLimit
  });

  // Create more stable query key that properly isolates different page requests
  const queryKey = ['entity-feed', {
    entityTypes: validEntityTypes.sort().join(','), // Convert to string for better stability
    tagId: tagId || 'none',
    search: search || 'empty',
    isApproved,
    limit: actualLimit,
    page: currentPage, // Use page instead of offset for cleaner cache keys
    itemsPerPage
  }];

  logger.debug("useEntityFeed query key:", queryKey);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      logger.debug(`useEntityFeed queryFn starting for page ${currentPage}:`, {
        entityTypes: validEntityTypes,
        tagId,
        search,
        isApproved,
        offset,
        actualLimit
      });

      try {
        const allEntities: Entity[] = [];
        let totalCount = 0;

        logger.debug(`EntityFeed: Fetching entities for page ${currentPage}, types: ${validEntityTypes.join(', ')}`);

        // For server-side pagination, we need to fetch from each entity type
        // and then combine and sort the results
        const entityPromises = validEntityTypes.map(async (entityType) => {
          logger.debug(`useEntityFeed fetching ${entityType}:`, {
            tagId,
            search,
            isApproved,
            actualLimit,
            page: Math.floor(offset / actualLimit) + 1
          });

          try {
            let entities: Entity[] = [];
            let count = 0;

            switch (entityType) {
              case EntityType.PERSON:
                const profilesResult = await profileApi.getAll({
                  filters: {
                    ...(isApproved !== false && { is_approved: true })
                  },
                  search,
                  sortBy: 'created_at',
                  sortDirection: 'desc',
                  limit: actualLimit,
                  page: Math.floor(offset / actualLimit) + 1,
                  includeCount: true,
                  select: '*, location:locations(*), tag_assignments(*, tag:tags(*))'
                });

                if (profilesResult.error) {
                  logger.error(`Error fetching profiles:`, profilesResult.error);
                  break;
                }

                let profileEntities = (profilesResult.data || []).map(profileToEntity);
                
                // Filter by tag on the client side if tagId is provided
                if (tagId) {
                  profileEntities = profileEntities.filter(entity => {
                    return entity.tags && Array.isArray(entity.tags) && 
                           entity.tags.some(tagAssignment => tagAssignment.tag_id === tagId);
                  });
                }

                entities = profileEntities;
                count = (profilesResult as any).totalCount || 0;
                logger.debug(`useEntityFeed ${entityType} result:`, {
                  entitiesCount: entities.length,
                  totalCount: count
                });
                break;

              case EntityType.ORGANIZATION:
                const orgsResult = await organizationApi.getAll({
                  filters: {},
                  search,
                  sortBy: 'created_at',
                  sortDirection: 'desc',
                  limit: actualLimit,
                  page: Math.floor(offset / actualLimit) + 1,
                  includeCount: true,
                  select: '*, location:locations(*), tag_assignments(*, tag:tags(*))'
                });

                if (orgsResult.error) {
                  logger.error(`Error fetching organizations:`, orgsResult.error);
                  break;
                }

                let orgEntities = (orgsResult.data || []).map(organizationToEntity);
                
                // Filter by tag on the client side if tagId is provided
                if (tagId) {
                  orgEntities = orgEntities.filter(entity => {
                    return entity.tags && Array.isArray(entity.tags) && 
                           entity.tags.some(tagAssignment => tagAssignment.tag_id === tagId);
                  });
                }

                entities = orgEntities;
                count = (orgsResult as any).totalCount || 0;
                logger.debug(`useEntityFeed ${entityType} result:`, {
                  entitiesCount: entities.length,
                  totalCount: count
                });
                break;

              case EntityType.EVENT:
                const eventsResult = await eventApi.getAll({
                  filters: {},
                  search,
                  sortBy: 'created_at',
                  sortDirection: 'desc',
                  limit: actualLimit,
                  page: Math.floor(offset / actualLimit) + 1,
                  includeCount: true,
                  select: '*, tag_assignments(*, tag:tags(*)), host:profiles(*), location:locations(*)'
                });

                if (eventsResult.error) {
                  logger.error(`Error fetching events:`, eventsResult.error);
                  break;
                }

                let eventEntities = (eventsResult.data || []).map(eventToEntity);
                
                // Filter by tag on the client side if tagId is provided
                if (tagId) {
                  eventEntities = eventEntities.filter(entity => {
                    return entity.tags && Array.isArray(entity.tags) && 
                           entity.tags.some(tagAssignment => tagAssignment.tag_id === tagId);
                  });
                }

                entities = eventEntities;
                count = (eventsResult as any).totalCount || 0;
                logger.debug(`useEntityFeed ${entityType} result:`, {
                  entitiesCount: entities.length,
                  totalCount: count
                });
                break;
            }

            return { entities, count };

          } catch (error) {
            logger.error(`Error processing ${entityType}:`, error);
            return { entities: [], count: 0 };
          }
        });

        // Wait for all entity type queries to complete
        const results = await Promise.all(entityPromises);
        
        // Combine all entities and counts
        results.forEach(result => {
          allEntities.push(...result.entities);
          totalCount += result.count;
        });

        logger.debug("useEntityFeed combined results:", {
          allEntitiesCount: allEntities.length,
          totalCount,
          currentPage
        });

        // Sort combined results by creation date (newest first)
        allEntities.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB.getTime() - dateA.getTime();
        });

        // For server-side pagination, determine if there's a next page
        const hasNextPage = allEntities.length === actualLimit;

        const result = {
          entities: allEntities,
          totalCount,
          hasNextPage,
          currentPage // Return the currentPage that was requested, not a computed one
        };

        logger.debug(`useEntityFeed queryFn returning for page ${currentPage}:`, {
          entitiesCount: result.entities.length,
          totalCount: result.totalCount,
          hasNextPage: result.hasNextPage,
          currentPage: result.currentPage
        });

        return result;

      } catch (error) {
        logger.error('EntityFeed error:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    // Keep previous data while loading new page to prevent flickering
    placeholderData: keepPreviousData,
    // Add retry configuration to prevent unnecessary retries on pagination
    retry: (failureCount, error) => {
      if (failureCount < 3) {
        logger.debug(`useEntityFeed retry attempt ${failureCount + 1}:`, error);
        return true;
      }
      return false;
    }
  });

  const hookResult = {
    entities: query.data?.entities || [],
    totalCount: query.data?.totalCount || 0,
    hasNextPage: query.data?.hasNextPage || false,
    currentPage: currentPage, // Always return the currentPage from params, not from query data
    isLoading: query.isLoading,
    error: query.error
  };

  logger.debug("useEntityFeed hook returning:", {
    entitiesCount: hookResult.entities.length,
    totalCount: hookResult.totalCount,
    hasNextPage: hookResult.hasNextPage,
    currentPage: hookResult.currentPage,
    isLoading: hookResult.isLoading,
    hasError: !!hookResult.error
  });

  return hookResult;
};
