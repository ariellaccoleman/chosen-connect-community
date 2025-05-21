
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
                
                if (tagId) {
                  // Fetch profiles with tag filtering - use raw SQL query
                  const { data: profiles } = await profileApi.getAll({ 
                    ...(filterByUserId ? { filters: { user_id: filterByUserId } } : {}),
                    query: `
                      SELECT DISTINCT p.*
                      FROM profiles p
                      JOIN tag_assignments ta ON p.id = ta.target_id
                      WHERE ta.target_type = 'person'
                      AND ta.tag_id = '${tagId}'
                      LIMIT ${limit}
                    `
                  });
                  
                  items = profiles || [];
                  logger.debug(`EntityFeed: Received ${items?.length || 0} profiles with tag filter`);
                } else {
                  // Regular fetch without tag filtering
                  const { data: profiles } = await profileApi.getAll({ 
                    filters: filterByUserId ? { user_id: filterByUserId } : undefined,
                    limit
                  });
                  items = profiles || [];
                  logger.debug(`EntityFeed: Received ${items?.length || 0} profiles without tag filter`);
                }
                break;
                
              case EntityType.ORGANIZATION:
                logger.debug(`EntityFeed: Fetching ORGANIZATION entities with tagId=${tagId}`);
                
                if (tagId) {
                  // Fetch organizations with tag filtering - use raw SQL query
                  const { data: orgs } = await organizationApi.getAll({ 
                    query: `
                      SELECT DISTINCT o.*
                      FROM organizations o
                      JOIN tag_assignments ta ON o.id = ta.target_id
                      WHERE ta.target_type = 'organization'
                      AND ta.tag_id = '${tagId}'
                      LIMIT ${limit}
                    `
                  });
                  
                  items = orgs || [];
                  logger.debug(`EntityFeed: Received ${items?.length || 0} organizations with tag filter`);
                  logger.debug(`EntityFeed: Tag filter SQL used:`, { 
                    tagId, 
                    firstItem: items[0] ? items[0].id : 'none'
                  });
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
                
                if (tagId) {
                  // Fetch events with tag filtering - use raw SQL query
                  const { data: events } = await eventApi.getAll({ 
                    query: `
                      SELECT DISTINCT e.*
                      FROM events e
                      JOIN tag_assignments ta ON e.id = ta.target_id
                      WHERE ta.target_type = 'event'
                      AND ta.tag_id = '${tagId}'
                      LIMIT ${limit}
                    `
                  });
                  
                  items = events || [];
                  logger.debug(`EntityFeed: Received ${items?.length || 0} events with tag filter, tag_id=${tagId}`);
                  
                  // Debug the first event if available
                  if (items.length > 0) {
                    logger.debug(`EntityFeed: Sample event:`, { id: items[0].id, title: items[0].title });
                  }
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
              // Get tag assignments for this entity if available
              if (item) {
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
