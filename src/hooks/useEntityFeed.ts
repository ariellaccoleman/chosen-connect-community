import { useQuery } from "@tanstack/react-query";
import { Entity } from "@/types/entity";
import { EntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";
import { supabase } from "@/integrations/supabase/client";
import { entityRegistry } from "@/registry";

interface UseEntityFeedOptions {
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
}: UseEntityFeedOptions) => {
  // This query fetches entities based on the provided entityTypes
  const { data: entitiesData, isLoading, error } = useQuery({
    queryKey: ["entities", { types: entityTypes, tagId, limit, filterByUserId }],
    queryFn: async () => {
      const allEntities: Entity[] = [];
      
      logger.debug(`EntityFeed: Starting fetch for types=${entityTypes.join(',')} with tagId=${tagId}`);
      
      // If tagId is provided, get all tagged entity IDs first
      let taggedEntityIds: Record<string, string[]> = {};
      
      if (tagId) {
        logger.debug(`EntityFeed: Fetching tagged entities for tagId=${tagId}`);
        
        // Get all entities tagged with this tag ID
        const { data: tagAssignments, error: tagError } = await supabase
          .from('entity_tag_assignments_view')
          .select('target_id, target_type')
          .eq('tag_id', tagId);
          
        if (tagError) {
          logger.error("EntityFeed: Failed to fetch tag assignments", tagError);
        } else if (tagAssignments) {
          // Group entity IDs by type for efficient filtering
          taggedEntityIds = tagAssignments.reduce((acc, assignment) => {
            const type = assignment.target_type;
            if (!acc[type]) acc[type] = [];
            acc[type].push(assignment.target_id);
            return acc;
          }, {} as Record<string, string[]>);
          
          logger.debug(`EntityFeed: Found tagged entities:`, 
            Object.entries(taggedEntityIds).map(([type, ids]) => `${type}: ${ids.length} items`));
        }
      }
      
      // Conditionally fetch each entity type
      await Promise.all(
        entityTypes.map(async (type) => {
          try {
            let items: any[] = [];
            
            // Fetch the appropriate data based on entity type
            switch (type) {
              case EntityType.PERSON:
                logger.debug(`EntityFeed: Fetching PERSON entities with tagId=${tagId}`);
                
                // Basic query for people
                let peopleQuery = supabase.from('profiles').select('*');
                
                // Apply filters
                if (filterByUserId) {
                  peopleQuery = peopleQuery.eq('id', filterByUserId);
                }
                
                // Apply tag filtering if we have tagged person IDs
                if (tagId && taggedEntityIds['person']?.length) {
                  peopleQuery = peopleQuery.in('id', taggedEntityIds['person']);
                  logger.debug(`EntityFeed: Filtering PERSON entities by ${taggedEntityIds['person'].length} tagged IDs`);
                } else if (tagId && !taggedEntityIds['person']?.length) {
                  // If we're filtering by tag but no people have this tag, return empty
                  logger.debug(`EntityFeed: No PERSON entities found with tagId=${tagId}`);
                  return;
                }
                
                // Apply limit and get results
                const { data: profiles, error: profilesError } = await peopleQuery.limit(limit);
                  
                if (profilesError) {
                  logger.error(`EntityFeed: Error fetching PERSON entities:`, profilesError);
                  return;
                }
                
                items = profiles || [];
                logger.debug(`EntityFeed: Received ${items?.length || 0} PERSON entities`);
                break;
                
              case EntityType.ORGANIZATION:
                logger.debug(`EntityFeed: Fetching ORGANIZATION entities with tagId=${tagId}`);
                
                // Basic query for organizations
                let orgsQuery = supabase.from('organizations').select('*');
                
                // Apply tag filtering if we have tagged organization IDs
                if (tagId && taggedEntityIds['organization']?.length) {
                  orgsQuery = orgsQuery.in('id', taggedEntityIds['organization']);
                  logger.debug(`EntityFeed: Filtering ORGANIZATION entities by ${taggedEntityIds['organization'].length} tagged IDs`);
                } else if (tagId && !taggedEntityIds['organization']?.length) {
                  // If we're filtering by tag but no organizations have this tag, return empty
                  logger.debug(`EntityFeed: No ORGANIZATION entities found with tagId=${tagId}`);
                  return;
                }
                
                // Apply limit and get results
                const { data: organizations, error: orgsError } = await orgsQuery.limit(limit);
                  
                if (orgsError) {
                  logger.error(`EntityFeed: Error fetching ORGANIZATION entities:`, orgsError);
                  return;
                }
                
                items = organizations || [];
                logger.debug(`EntityFeed: Received ${items?.length || 0} ORGANIZATION entities`);
                break;
                
              case EntityType.EVENT:
                logger.debug(`EntityFeed: Fetching EVENT entities with tagId=${tagId}`);
                
                // Basic query for events
                let eventsQuery = supabase.from('events').select('*');
                
                // Apply tag filtering if we have tagged event IDs
                if (tagId && taggedEntityIds['event']?.length) {
                  eventsQuery = eventsQuery.in('id', taggedEntityIds['event']);
                  logger.debug(`EntityFeed: Filtering EVENT entities by ${taggedEntityIds['event'].length} tagged IDs`);
                } else if (tagId && !taggedEntityIds['event']?.length) {
                  // If we're filtering by tag but no events have this tag, return empty
                  logger.debug(`EntityFeed: No EVENT entities found with tagId=${tagId}`);
                  return;
                }
                
                // Apply limit and get results
                const { data: events, error: eventsError } = await eventsQuery.limit(limit);
                  
                if (eventsError) {
                  logger.error(`EntityFeed: Error fetching EVENT entities:`, eventsError);
                  return;
                }
                
                items = events || [];
                logger.debug(`EntityFeed: Received ${items?.length || 0} EVENT entities`);
                break;
                
              default:
                logger.warn(`Unsupported entity type: ${type}`);
                return;
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
                        name: entity.name
                      });
                      
                      // Initialize empty tags array that will be populated later if needed
                      entity.tags = [];
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
      
      // After all entities are fetched, if tagId was provided, fetch tags for each entity
      if (tagId) {
        try {
          logger.debug(`EntityFeed: Fetching tags for each entity`);
          
          // For each entity, fetch its tags - this is now just to get the tag details
          // since we already filtered by tag
          for (const entity of allEntities) {
            const { data: tagAssignments, error: tagError } = await supabase
              .from('entity_tag_assignments_view')
              .select('*, tag:tag_id(id, name, description)')
              .eq('target_id', entity.id)
              .eq('target_type', entity.entityType);
              
            if (tagError) {
              logger.error(`EntityFeed: Error fetching tags for ${entity.entityType} entity:`, tagError);
            } else if (tagAssignments && tagAssignments.length > 0) {
              // Add tags to entity
              entity.tags = tagAssignments.map(assignment => ({
                id: assignment.id,
                tag_id: assignment.tag_id,
                target_id: assignment.target_id,
                target_type: assignment.target_type,
                created_at: assignment.created_at || '',
                updated_at: assignment.updated_at || '',
                tag: {
                  id: assignment.tag?.id || '',
                  name: assignment.tag?.name || '',
                  description: assignment.tag?.description || null,
                  created_by: null,
                  created_at: '',
                  updated_at: ''
                }
              }));
            }
          }
        } catch (e) {
          logger.error(`EntityFeed: Error fetching tags for entities:`, e);
        }
      }
      
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
