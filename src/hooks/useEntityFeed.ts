
import { useQuery } from "@tanstack/react-query";
import { Entity } from "@/types/entity";
import { EntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";
import { entityRegistry } from "@/registry";
import { profileApi } from "@/api/profiles";
import { organizationApi } from "@/api/organizations";
import { eventApi } from "@/api/events";
import { postsApi } from "@/api/posts";

interface UseEntityFeedOptions {
  entityTypes: EntityType[];
  tagId?: string | null;
  limit?: number;
  filterByUserId?: string | null;
  // Profile-specific options
  search?: string;
  isApproved?: boolean;
}

/**
 * Custom hook to fetch entities of specified types, optionally filtered by tag
 * Now simplified to use view APIs with pre-loaded tags
 */
export const useEntityFeed = ({
  entityTypes,
  tagId = null,
  limit = 10,
  filterByUserId = null,
  search = "",
  isApproved = true,
}: UseEntityFeedOptions) => {
  // This query fetches entities based on the provided entityTypes using view APIs
  const { data: entitiesData, isLoading, error } = useQuery({
    queryKey: ["entities", { types: entityTypes, tagId, limit, filterByUserId, search, isApproved }],
    queryFn: async () => {
      const allEntities: Entity[] = [];
      
      logger.debug(`EntityFeed: Starting simplified fetch for types=${entityTypes.join(',')} with tagId=${tagId}, search=${search}`);
      
      // Fetch each entity type using their view APIs with pre-loaded tags
      await Promise.all(
        entityTypes.map(async (type) => {
          try {
            let items: any[] = [];
            
            // Common query options
            const queryOptions = {
              search: search || undefined,
              limit,
              tagId, // Pass tagId for database-level filtering
              includeTags: true // Always include tags from views
            };
            
            // Fetch the appropriate data based on entity type using view APIs
            switch (type) {
              case EntityType.PERSON:
                logger.debug(`EntityFeed: Fetching PERSON entities from view with tagId=${tagId}, search=${search}, isApproved=${isApproved}`);
                
                // Build filters for people
                const peopleFilters: any = {};
                
                // Apply profile-specific filters
                if (filterByUserId) {
                  peopleFilters.id = filterByUserId;
                }
                
                // Apply approved filter for profiles
                if (isApproved !== undefined) {
                  peopleFilters.is_approved = isApproved;
                }
                
                // Use the profile API with view support
                const profilesResponse = await profileApi.getAll({
                  filters: peopleFilters,
                  ...queryOptions
                });
                  
                if (profilesResponse.error) {
                  logger.error(`EntityFeed: Error fetching PERSON entities:`, profilesResponse.error);
                  break;
                }
                
                items = profilesResponse.data || [];
                logger.debug(`EntityFeed: Received ${items?.length || 0} PERSON entities from view`);
                break;
                
              case EntityType.ORGANIZATION:
                logger.debug(`EntityFeed: Fetching ORGANIZATION entities from view with tagId=${tagId}, search=${search}`);
                
                // Use the organization API with view support
                const orgsResponse = await organizationApi.getAll({
                  filters: {},
                  ...queryOptions
                });
                  
                if (orgsResponse.error) {
                  logger.error(`EntityFeed: Error fetching ORGANIZATION entities:`, orgsResponse.error);
                  break;
                }
                
                items = orgsResponse.data || [];
                logger.debug(`EntityFeed: Received ${items?.length || 0} ORGANIZATION entities from view`);
                break;
                
              case EntityType.EVENT:
                logger.debug(`EntityFeed: Fetching EVENT entities from view with tagId=${tagId}, search=${search}`);
                
                // Use the event API with view support
                const eventsResponse = await eventApi.getAll({
                  filters: {},
                  ...queryOptions
                });
                  
                if (eventsResponse.error) {
                  logger.error(`EntityFeed: Error fetching EVENT entities:`, eventsResponse.error);
                  break;
                }
                
                items = eventsResponse.data || [];
                logger.debug(`EntityFeed: Received ${items?.length || 0} EVENT entities from view`);
                break;
                
              case EntityType.POST:
                logger.debug(`EntityFeed: Fetching POST entities with tagId=${tagId}, search=${search}`);
                
                // Posts don't have a view yet, so use existing logic for now
                // TODO: Create posts_with_tags view in future
                const postFilters: any = {};
                
                const postsResponse = await postsApi.getAll({
                  filters: postFilters,
                  search: search || undefined,
                  limit
                });
                  
                if (postsResponse.error) {
                  logger.error(`EntityFeed: Error fetching POST entities:`, postsResponse.error);
                  break;
                }
                
                items = postsResponse.data || [];
                logger.debug(`EntityFeed: Received ${items?.length || 0} POST entities`);
                break;
                
              default:
                logger.warn(`Unsupported entity type: ${type}`);
                break;
            }
            
            // Convert each item to an Entity and add to results
            if (items && items.length > 0) {
              items.forEach((item) => {
                if (item) {
                  try {
                    // Use the entity registry to convert data to entity
                    const entity = entityRegistry.toEntity(item, type);
                    
                    if (entity) {
                      logger.debug(`EntityFeed: Converted ${type} to entity`, {
                        id: entity.id,
                        entityType: entity.entityType,
                        name: entity.name,
                        tagsCount: entity.tags?.length || 0
                      });
                      
                      allEntities.push(entity);
                    } else {
                      logger.warn(`EntityFeed: Failed to convert ${type} to entity`, { itemId: item?.id });
                    }
                  } catch (conversionError) {
                    logger.error(`EntityFeed: Error converting ${type} entity:`, conversionError);
                  }
                }
              });
            }
          } catch (e) {
            logger.error(`Error fetching ${type} entities:`, e);
          }
        })
      );
      
      logger.debug(`EntityFeed: Simplified fetch completed, found ${allEntities.length} total entities`);
      return allEntities;
    },
    enabled: entityTypes.length > 0,
  });
  
  return {
    entities: entitiesData || [],
    isLoading,
    error,
  };
};

export default useEntityFeed;
