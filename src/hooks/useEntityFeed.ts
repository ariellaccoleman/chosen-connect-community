
import { useQuery } from "@tanstack/react-query";
import { Entity } from "@/types/entity";
import { EntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";
import { entityRegistry } from "@/registry";
import { profileApi } from "@/api/profiles";
import { organizationApi } from "@/api/organizations";
import { eventApi } from "@/api/events";
import { postsApi, getPostsWithDetails } from "@/api/posts";
import { tagAssignmentApi } from "@/api/tags";

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
 */
export const useEntityFeed = ({
  entityTypes,
  tagId = null,
  limit = 10,
  filterByUserId = null,
  search = "",
  isApproved = true,
}: UseEntityFeedOptions) => {
  // This query fetches entities based on the provided entityTypes
  const { data: entitiesData, isLoading, error } = useQuery({
    queryKey: ["entities", { types: entityTypes, tagId, limit, filterByUserId, search, isApproved }],
    queryFn: async () => {
      const allEntities: Entity[] = [];
      
      logger.debug(`EntityFeed: Starting fetch for types=${entityTypes.join(',')} with tagId=${tagId}, search=${search}`);
      
      // If tagId is provided, get all tagged entity IDs first
      let taggedEntityIds: Record<string, string[]> = {};
      
      if (tagId) {
        logger.debug(`EntityFeed: Fetching tagged entities for tagId=${tagId}`);
        
        // Get all entities tagged with this tag ID using the API
        const tagAssignmentsResponse = await tagAssignmentApi.getAll({
          filters: { tag_id: tagId }
        });
          
        if (tagAssignmentsResponse.error) {
          logger.error("EntityFeed: Failed to fetch tag assignments", tagAssignmentsResponse.error);
        } else if (tagAssignmentsResponse.data) {
          // Group entity IDs by type for efficient filtering
          taggedEntityIds = tagAssignmentsResponse.data.reduce((acc, assignment) => {
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
            
            // Map EntityType enum to database target_type values
            const getTargetType = (entityType: EntityType): string => {
              switch (entityType) {
                case EntityType.PERSON:
                  return 'person';
                case EntityType.ORGANIZATION:
                  return 'organization';
                case EntityType.EVENT:
                  return 'event';
                case EntityType.POST:
                  return 'post';
                case EntityType.HUB:
                  return 'hub';
                default:
                  return entityType.toLowerCase();
              }
            };

            const targetType = getTargetType(type);
            
            // If we have a tag filter and no entities of this type have this tag, skip
            if (tagId && (!taggedEntityIds[targetType] || taggedEntityIds[targetType].length === 0)) {
              logger.debug(`EntityFeed: No ${type} entities found with tagId=${tagId}, skipping`);
              return;
            }
            
            // Fetch the appropriate data based on entity type using API factories
            switch (type) {
              case EntityType.PERSON:
                logger.debug(`EntityFeed: Fetching PERSON entities with tagId=${tagId}, search=${search}, isApproved=${isApproved}`);
                
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
                
                // Apply tag filtering if we have tagged person IDs
                if (tagId && taggedEntityIds[targetType]?.length) {
                  // For API factory, we'll need to handle this differently
                  // since we can't directly filter by array of IDs in the simple filter
                  peopleFilters.id = taggedEntityIds[targetType];
                  logger.debug(`EntityFeed: Filtering PERSON entities by ${taggedEntityIds[targetType].length} tagged IDs`);
                }
                
                // Use the profile API with search
                const profilesResponse = await profileApi.getAll({
                  filters: peopleFilters,
                  search: search || undefined,
                  limit
                });
                  
                if (profilesResponse.error) {
                  logger.error(`EntityFeed: Error fetching PERSON entities:`, profilesResponse.error);
                  break;
                }
                
                items = profilesResponse.data || [];
                logger.debug(`EntityFeed: Received ${items?.length || 0} PERSON entities`);
                break;
                
              case EntityType.ORGANIZATION:
                logger.debug(`EntityFeed: Fetching ORGANIZATION entities with tagId=${tagId}, search=${search}`);
                
                // Build filters for organizations
                const orgFilters: any = {};
                
                // Apply tag filtering if we have tagged organization IDs
                if (tagId && taggedEntityIds[targetType]?.length) {
                  orgFilters.id = taggedEntityIds[targetType];
                  logger.debug(`EntityFeed: Filtering ORGANIZATION entities by ${taggedEntityIds[targetType].length} tagged IDs`);
                }
                
                // Use the organization API with search
                const orgsResponse = await organizationApi.getAll({
                  filters: orgFilters,
                  search: search || undefined,
                  limit
                });
                  
                if (orgsResponse.error) {
                  logger.error(`EntityFeed: Error fetching ORGANIZATION entities:`, orgsResponse.error);
                  break;
                }
                
                items = orgsResponse.data || [];
                logger.debug(`EntityFeed: Received ${items?.length || 0} ORGANIZATION entities`);
                break;
                
              case EntityType.EVENT:
                logger.debug(`EntityFeed: Fetching EVENT entities with tagId=${tagId}, search=${search}`);
                
                // Build filters for events
                const eventFilters: any = {};
                
                // Apply tag filtering if we have tagged event IDs
                if (tagId && taggedEntityIds[targetType]?.length) {
                  eventFilters.id = taggedEntityIds[targetType];
                  logger.debug(`EntityFeed: Filtering EVENT entities by ${taggedEntityIds[targetType].length} tagged IDs`);
                }
                
                // Use the event API with search
                const eventsResponse = await eventApi.getAll({
                  filters: eventFilters,
                  search: search || undefined,
                  limit
                });
                  
                if (eventsResponse.error) {
                  logger.error(`EntityFeed: Error fetching EVENT entities:`, eventsResponse.error);
                  break;
                }
                
                items = eventsResponse.data || [];
                logger.debug(`EntityFeed: Received ${items?.length || 0} EVENT entities`);
                break;
                
              case EntityType.POST:
                logger.debug(`EntityFeed: Fetching POST entities with tagId=${tagId}, search=${search}`);
                
                // Use getPostsWithDetails to get full post data including author, likes, comments
                const postsResponse = await getPostsWithDetails(limit, 0);
                  
                if (postsResponse.error) {
                  logger.error(`EntityFeed: Error fetching POST entities:`, postsResponse.error);
                  break;
                }
                
                let postItems = postsResponse.data || [];
                
                // Apply tag filtering if we have tagged post IDs
                if (tagId && taggedEntityIds[targetType]?.length) {
                  postItems = postItems.filter(post => taggedEntityIds[targetType].includes(post.id));
                  logger.debug(`EntityFeed: Filtered POST entities by ${taggedEntityIds[targetType].length} tagged IDs, result: ${postItems.length} posts`);
                }
                
                // Apply search filtering if provided
                if (search && search.trim()) {
                  const searchLower = search.toLowerCase();
                  postItems = postItems.filter(post => 
                    post.content?.toLowerCase().includes(searchLower) ||
                    post.author?.name?.toLowerCase().includes(searchLower)
                  );
                  logger.debug(`EntityFeed: Applied search filter to posts, result: ${postItems.length} posts`);
                }
                
                items = postItems;
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
                    // For posts, we need to preserve the full data structure
                    if (type === EntityType.POST) {
                      // Create entity with post content as description and preserve all post data
                      const entity: Entity = {
                        id: item.id,
                        entityType: EntityType.POST,
                        name: `Post by ${item.author?.name || 'Unknown'}`,
                        description: item.content || '',
                        imageUrl: item.author?.avatar || undefined,
                        created_at: item.created_at,
                        updated_at: item.updated_at,
                        location: null,
                        tags: [], // Will be populated later if needed
                        // Preserve the full post data in rawData
                        rawData: item
                      } as Entity & { rawData: any };
                      
                      logger.debug(`EntityFeed: Created POST entity`, {
                        id: entity.id,
                        entityType: entity.entityType,
                        name: entity.name,
                        hasAuthor: !!item.author,
                        hasContent: !!item.content
                      });
                      
                      allEntities.push(entity);
                    } else {
                      // Use the entity registry to convert data to entity for other types
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
            const tagAssignmentsResponse = await tagAssignmentApi.getAll({
              filters: {
                target_id: entity.id,
                target_type: entity.entityType
              }
            });
              
            if (tagAssignmentsResponse.error) {
              logger.error(`EntityFeed: Error fetching tags for ${entity.entityType} entity:`, tagAssignmentsResponse.error);
            } else if (tagAssignmentsResponse.data && tagAssignmentsResponse.data.length > 0) {
              // Add tags to entity
              entity.tags = tagAssignmentsResponse.data.map(assignment => ({
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
