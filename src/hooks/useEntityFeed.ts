
import { useQuery } from "@tanstack/react-query";
import { Entity } from "@/types/entity";
import { EntityType } from "@/types/entityTypes";
import { useEntityRegistry } from "@/hooks/useEntityRegistry";
import { logger } from "@/utils/logger";
import { supabase } from "@/integrations/supabase/client";

/**
 * Custom hook to fetch entities of specified types, optionally filtered by tag
 */
export const useEntityFeed = ({
  entityTypes,
  tagId = null,
  limit = 10,
  filterByUserId = null,
}: {
  entityTypes: EntityType[];
  tagId?: string | null;
  limit?: number;
  filterByUserId?: string | null;
}) => {
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
                
                // Using our people_with_tags view with query builder
                let peopleQuery = supabase
                  .from('people_with_tags')
                  .select('*');
                
                // Apply filters if needed
                if (tagId) {
                  peopleQuery = peopleQuery.eq('assigned_tag_id', tagId);
                  logger.debug(`EntityFeed: Filtering PERSON entities by tag_id=${tagId}`);
                }
                
                if (filterByUserId) {
                  peopleQuery = peopleQuery.eq('user_id', filterByUserId);
                  logger.debug(`EntityFeed: Filtering PERSON entities by user_id=${filterByUserId}`);
                }
                
                // Apply limit and get results
                const { data: profiles, error: profilesError } = await peopleQuery
                  .limit(limit);
                  
                if (profilesError) {
                  logger.error(`EntityFeed: Error fetching PERSON entities:`, profilesError);
                  return;
                }
                
                items = profiles || [];
                logger.debug(`EntityFeed: Received ${items?.length || 0} PERSON entities`);
                break;
                
              case EntityType.ORGANIZATION:
                logger.debug(`EntityFeed: Fetching ORGANIZATION entities with tagId=${tagId}`);
                
                // Using our organizations_with_tags view with query builder
                let orgsQuery = supabase
                  .from('organizations_with_tags')
                  .select('*');
                
                // Apply tag filter if needed
                if (tagId) {
                  orgsQuery = orgsQuery.eq('assigned_tag_id', tagId);
                  logger.debug(`EntityFeed: Filtering ORGANIZATION entities by tag_id=${tagId}`);
                }
                
                // Apply limit and get results
                const { data: organizations, error: orgsError } = await orgsQuery
                  .limit(limit);
                  
                if (orgsError) {
                  logger.error(`EntityFeed: Error fetching ORGANIZATION entities:`, orgsError);
                  return;
                }
                
                items = organizations || [];
                logger.debug(`EntityFeed: Received ${items?.length || 0} ORGANIZATION entities`);
                break;
                
              case EntityType.EVENT:
                logger.debug(`EntityFeed: Fetching EVENT entities with tagId=${tagId}`);
                
                // Using our events_with_tags view with query builder
                let eventsQuery = supabase
                  .from('events_with_tags')
                  .select('*');
                
                // Apply tag filter if needed
                if (tagId) {
                  eventsQuery = eventsQuery.eq('assigned_tag_id', tagId);
                  logger.debug(`EntityFeed: Filtering EVENT entities by assigned_tag_id=${tagId}`);
                }
                
                // Apply limit and get results
                const { data: events, error: eventsError } = await eventsQuery
                  .limit(limit);
                  
                if (eventsError) {
                  logger.error(`EntityFeed: Error fetching EVENT entities:`, eventsError);
                  return;
                }
                
                items = events || [];
                logger.debug(`EntityFeed: Received ${items?.length || 0} EVENT entities`);
                
                // Debug the first event if available
                if (items.length > 0) {
                  logger.debug(`EntityFeed: Sample event:`, { id: items[0].id, title: items[0].title });
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
            items.forEach((item) => {
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
