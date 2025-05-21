
import { useQuery } from "@tanstack/react-query";
import { Entity } from "@/types/entity";
import { EntityType } from "@/types/entityTypes";
import { useEntityRegistry } from "@/hooks/useEntityRegistry";
import { logger } from "@/utils/logger";

// Import needed APIs
import { organizationsApi } from "@/api/organizations";
import { eventsApi } from "@/api/events";
import { profilesApi } from "@/api/profiles";

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
                const { data: profiles } = await profilesApi.getAllProfiles({ 
                  tagId, 
                  limit, 
                  filterByUserId 
                });
                items = profiles || [];
                break;
                
              case EntityType.ORGANIZATION:
                const { data: orgs } = await organizationsApi.getAllOrganizations({ 
                  tagId, 
                  limit
                });
                items = orgs || [];
                break;
                
              case EntityType.EVENT:
                const { data: events } = await eventsApi.getAllEvents({ 
                  tagId, 
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
