
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
      
      // Conditionally fetch each entity type
      await Promise.all(
        entityTypes.map(async (type) => {
          try {
            let items = [];
            
            // Fetch the appropriate data based on entity type
            switch (type) {
              case EntityType.PERSON:
                logger.debug(`EntityFeed: Fetching PERSON entities with tagId=${tagId}`);
                const { data: profiles } = await profileApi.getAll({ 
                  filters: { 
                    ...(tagId ? { tag_id: tagId } : {}),
                    ...(filterByUserId ? { user_id: filterByUserId } : {})
                  },
                  limit
                });
                items = profiles || [];
                break;
                
              case EntityType.ORGANIZATION:
                logger.debug(`EntityFeed: Fetching ORGANIZATION entities with tagId=${tagId}`);
                const { data: orgs } = await organizationApi.getAll({ 
                  filters: { 
                    ...(tagId ? { tag_id: tagId } : {})
                  },
                  limit
                });
                items = orgs || [];
                break;
                
              case EntityType.EVENT:
                logger.debug(`EntityFeed: Fetching EVENT entities with tagId=${tagId}`);
                const { data: events } = await eventApi.getAll({ 
                  filters: { 
                    ...(tagId ? { tag_id: tagId } : {})
                  },
                  limit
                });
                items = events || [];
                break;
                
              // Add more cases as needed for other entity types
              
              default:
                logger.warn(`Unsupported entity type: ${type}`);
                return;
            }
            
            // Convert each item to an Entity and add to results
            items.forEach(item => {
              const entity = toEntity(item, type);
              if (entity) {
                logger.debug(`EntityFeed: Converted ${type} to entity`, {
                  id: entity.id,
                  entityType: entity.entityType,
                  name: entity.name
                });
                allEntities.push(entity);
              } else {
                logger.warn(`EntityFeed: Failed to convert ${type} to entity`, { item });
              }
            });
          } catch (e) {
            logger.error(`Error fetching ${type} entities:`, e);
          }
        })
      );
      
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
