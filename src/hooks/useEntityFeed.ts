
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

  // Create query key that includes all parameters that affect the data
  const queryKey = ['entity-feed', {
    entityTypes: validEntityTypes.sort(),
    tagId,
    search,
    isApproved,
    limit: actualLimit,
    offset
  }];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const allEntities: Entity[] = [];
        let totalCount = 0;

        logger.debug(`EntityFeed: Fetching entities for page ${currentPage}, types: ${validEntityTypes.join(', ')}`);

        // For server-side pagination, we need to fetch from each entity type
        // and then combine and sort the results
        const entityPromises = validEntityTypes.map(async (entityType) => {
          try {
            let entities: Entity[] = [];
            let count = 0;

            switch (entityType) {
              case EntityType.PERSON:
                // Build query with tag filtering if needed
                let profileQuery = `*, location:locations(*), tags:tag_assignments(*, tag:tags(*))`;
                
                // Add tag filtering to the query if tagId is provided
                if (tagId) {
                  profileQuery = `*, location:locations(*), tags:tag_assignments!inner(*, tag:tags(*))`;
                }

                const profilesResult = await profileApi.getAll({
                  filters: {
                    ...(isApproved !== false && { is_approved: true }),
                    ...(tagId && { 
                      'tag_assignments.tag_id': tagId 
                    })
                  },
                  search,
                  sortBy: 'created_at',
                  sortDirection: 'desc',
                  limit: actualLimit,
                  page: Math.floor(offset / actualLimit) + 1
                });

                if (profilesResult.error) {
                  logger.error(`Error fetching profiles:`, profilesResult.error);
                  break;
                }

                entities = (profilesResult.data || []).map(profileToEntity);
                count = profilesResult.data?.length || 0;
                break;

              case EntityType.ORGANIZATION:
                let orgQuery = `*, location:locations(*), tags:tag_assignments(*, tag:tags(*))`;
                
                if (tagId) {
                  orgQuery = `*, location:locations(*), tags:tag_assignments!inner(*, tag:tags(*))`;
                }

                const orgsResult = await organizationApi.getAll({
                  filters: {
                    ...(tagId && { 
                      'tag_assignments.tag_id': tagId 
                    })
                  },
                  search,
                  sortBy: 'created_at',
                  sortDirection: 'desc',
                  limit: actualLimit,
                  page: Math.floor(offset / actualLimit) + 1
                });

                if (orgsResult.error) {
                  logger.error(`Error fetching organizations:`, orgsResult.error);
                  break;
                }

                entities = (orgsResult.data || []).map(organizationToEntity);
                count = orgsResult.data?.length || 0;
                break;

              case EntityType.EVENT:
                let eventQuery = `*, tags:tag_assignments(*, tag:tags(*)), host:profiles(*), location:locations(*)`;
                
                if (tagId) {
                  eventQuery = `*, tags:tag_assignments!inner(*, tag:tags(*)), host:profiles(*), location:locations(*)`;
                }

                const eventsResult = await eventApi.getAll({
                  filters: {
                    ...(tagId && { 
                      'tag_assignments.tag_id': tagId 
                    })
                  },
                  search,
                  sortBy: 'created_at',
                  sortDirection: 'desc',
                  limit: actualLimit,
                  page: Math.floor(offset / actualLimit) + 1
                });

                if (eventsResult.error) {
                  logger.error(`Error fetching events:`, eventsResult.error);
                  break;
                }

                entities = (eventsResult.data || []).map(eventToEntity);
                count = eventsResult.data?.length || 0;
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

        // Sort combined results by creation date (newest first)
        allEntities.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB.getTime() - dateA.getTime();
        });

        // For server-side pagination, determine if there's a next page
        const hasNextPage = allEntities.length === actualLimit;

        logger.debug(`EntityFeed: Returning ${allEntities.length} entities for page ${currentPage}, total found: ${totalCount}`);

        return {
          entities: allEntities,
          totalCount,
          hasNextPage,
          currentPage
        };

      } catch (error) {
        logger.error('EntityFeed error:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    entities: query.data?.entities || [],
    totalCount: query.data?.totalCount || 0,
    hasNextPage: query.data?.hasNextPage || false,
    currentPage: query.data?.currentPage || currentPage,
    isLoading: query.isLoading,
    error: query.error
  };
};
