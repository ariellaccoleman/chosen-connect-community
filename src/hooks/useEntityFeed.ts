
import { useQuery } from "@tanstack/react-query";
import { Entity } from "@/types/entity";
import { EntityType } from "@/types/entityTypes";
import { useEntityRegistry } from "@/hooks/useEntityRegistry";
import { logger } from "@/utils/logger";

// Import proper API clients and their methods
import { profileApi } from "@/api/profiles";
import { organizationApi } from "@/api/organizations";
import { eventApi } from "@/api/events";

interface UseEntityFeedProps {
  entityTypes: EntityType[];
  tagId?: string | null;
  limit?: number;
  filterByUserId?: string | null;
}

/**
 * Custom hook to fetch entities of specified types, optionally filtered by tag
 */
export const useEntityFeed = ({
  entityTypes,
  tagId = null,
  limit = 10,
  filterByUserId = null,
}: UseEntityFeedProps) => {
  const { toEntity } = useEntityRegistry();
  
  // This query fetches entities based on the provided entityTypes
  const { data: entitiesData, isLoading, error } = useQuery({
    queryKey: ["entities", { types: entityTypes, tagId, limit, filterByUserId }],
    queryFn: async () => {
      const allEntities: Entity[] = [];
      
      logger.debug(`EntityFeed: Starting fetch for types=${entityTypes.join(',')} with tagId=${tagId}`);
      
      // Conditionally fetch each entity type
      await Promise.all(
        entityTypes.map(async (type) => {
          try {
            let items = [];
            
            // Fetch the appropriate data based on entity type
            switch (type) {
              case EntityType.PERSON:
                logger.debug(`EntityFeed: Fetching PERSON entities with tagId=${tagId}`);
                
                // For people, we need to filter by tag_assignments if tagId is provided
                if (tagId) {
                  const { data: profiles } = await profileApi.getAll({ 
                    params: {
                      select: '*',
                      ...(tagId ? { 
                        // Use tag_assignments filtering for profiles
                        'tag_assignments.tag_id': `eq.${tagId}`,
                        'tag_assignments.target_type': 'eq.person' 
                      } : {})
                    },
                    ...(filterByUserId ? { filters: { user_id: filterByUserId } } : {}),
                    limit
                  });
                  
                  items = profiles || [];
                  logger.debug(`EntityFeed: Received ${items?.length || 0} profiles with tag filter`);
                } else {
                  // Regular fetch without tag filtering
                  const { data: profiles } = await profileApi.getAll({ 
                    ...(filterByUserId ? { filters: { user_id: filterByUserId } } : {}),
                    limit
                  });
                  items = profiles || [];
                  logger.debug(`EntityFeed: Received ${items?.length || 0} profiles without tag filter`);
                }
                break;
                
              case EntityType.ORGANIZATION:
                logger.debug(`EntityFeed: Fetching ORGANIZATION entities with tagId=${tagId}`);
                
                // For organizations, filter by tag_assignments if tagId is provided
                if (tagId) {
                  const { data: orgs } = await organizationApi.getAll({ 
                    params: {
                      select: '*',
                      ...(tagId ? { 
                        // Use tag_assignments filtering for organizations
                        'tag_assignments.tag_id': `eq.${tagId}`,
                        'tag_assignments.target_type': 'eq.organization' 
                      } : {})
                    },
                    limit
                  });
                  
                  items = orgs || [];
                  logger.debug(`EntityFeed: Received ${items?.length || 0} organizations with tag filter`);
                } else {
                  // Regular fetch without tag filtering
                  const { data: orgs } = await organizationApi.getAll({ 
                    limit
                  });
                  items = orgs || [];
                  logger.debug(`EntityFeed: Received ${items?.length || 0} organizations without tag filter`);
                }
                break;
                
              case EntityType.EVENT:
                logger.debug(`EntityFeed: Fetching EVENT entities with tagId=${tagId}`);
                
                // For events, filter by tag_assignments if tagId is provided
                if (tagId) {
                  const { data: events } = await eventApi.getAll({ 
                    params: {
                      select: '*',
                      ...(tagId ? { 
                        // Use tag_assignments filtering for events
                        'tag_assignments.tag_id': `eq.${tagId}`,
                        'tag_assignments.target_type': 'eq.event' 
                      } : {})
                    },
                    limit
                  });
                  
                  items = events || [];
                  logger.debug(`EntityFeed: Received ${items?.length || 0} events with tag filter`);
                } else {
                  // Regular fetch without tag filtering
                  const { data: events } = await eventApi.getAll({ 
                    limit
                  });
                  items = events || [];
                  logger.debug(`EntityFeed: Received ${items?.length || 0} events without tag filter`);
                }
                break;
                
              default:
                logger.warn(`Unsupported entity type: ${type}`);
                return;
            }
            
            // Log the structure of first item to help debug conversion issues
            if (items && items.length > 0) {
              logger.debug(`Sample ${type} item structure:`, JSON.stringify(items[0]).substring(0, 200) + "...");
            } else {
              logger.debug(`No ${type} items found for the given filters`);
            }
            
            // Convert each item to an Entity and add to results
            items.forEach((item: any) => {
              const entity = toEntity(item, type);
              if (entity) {
                logger.debug(`EntityFeed: Converted ${type} to entity`, {
                  id: entity.id,
                  entityType: entity.entityType,
                  name: entity.name
                });
                allEntities.push(entity);
              } else {
                logger.warn(`EntityFeed: Failed to convert ${type} to entity`, { itemId: item?.id });
              }
            });
          } catch (e) {
            logger.error(`Error fetching ${type} entities:`, e);
          }
        })
      );
      
      logger.debug(`EntityFeed: Finished fetching entities, found ${allEntities.length} total entities`);
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
