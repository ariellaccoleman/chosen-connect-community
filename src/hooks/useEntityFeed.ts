
import { useQuery } from "@tanstack/react-query";
import { EntityType } from "@/types/entityTypes";
import { Entity } from "@/types/entity";
import { logger } from "@/utils/logger";
import { organizationsWithTagsApi } from "@/api/organizations/organizationApiFactory";
import { peopleWithTagsApi } from "@/api/profiles/profileApiFactory";
import { eventsWithTagsApi } from "@/api/events/eventApiFactory";
import { postsWithTagsApi } from "@/api/posts/postsApiFactory";

interface UseEntityFeedProps {
  entityTypes: EntityType[];
  limit?: number;
  tagId?: string | null;
  search?: string;
  isApproved?: boolean;
}

export const useEntityFeed = ({
  entityTypes,
  limit = 50,
  tagId,
  search = "",
  isApproved = true
}: UseEntityFeedProps) => {
  return useQuery({
    queryKey: ['entity-feed', entityTypes, limit, tagId, search, isApproved],
    queryFn: async () => {
      const allEntities: Entity[] = [];
      
      logger.debug(`useEntityFeed: Fetching entities for types: ${entityTypes.join(', ')}`, {
        tagId,
        search,
        isApproved,
        limit
      });

      // Fetch data for each entity type
      for (const entityType of entityTypes) {
        try {
          let apiResponse;
          
          switch (entityType) {
            case EntityType.ORGANIZATION:
              if (tagId) {
                // Use tag filtering for organizations
                apiResponse = await organizationsWithTagsApi.filterByTagNames([tagId]);
              } else if (search) {
                apiResponse = await organizationsWithTagsApi.search('name', search);
              } else {
                apiResponse = await organizationsWithTagsApi.getAll();
              }
              break;
              
            case EntityType.PERSON:
              let query = peopleWithTagsApi.select();
              
              // Apply filters
              if (isApproved) {
                query = query.eq('is_approved', true);
              }
              if (search) {
                query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,headline.ilike.%${search}%`);
              }
              if (tagId) {
                // Use PostgreSQL array overlap operator for tag filtering
                query = query.overlaps('tag_names', [tagId]);
              }
              
              const result = await query.execute();
              apiResponse = result.isSuccess() ? result : { isSuccess: () => false, data: [] };
              break;
              
            case EntityType.EVENT:
              if (tagId) {
                apiResponse = await eventsWithTagsApi.filterByTagNames([tagId]);
              } else if (search) {
                apiResponse = await eventsWithTagsApi.search('title', search);
              } else {
                apiResponse = await eventsWithTagsApi.getAll();
              }
              break;
              
            case EntityType.POST:
              if (tagId) {
                // Use tag filtering for posts with the new posts_with_tags view
                apiResponse = await postsWithTagsApi.filterByTagNames([tagId]);
              } else if (search) {
                apiResponse = await postsWithTagsApi.search('content', search);
              } else {
                apiResponse = await postsWithTagsApi.getAll();
              }
              break;
              
            default:
              logger.warn(`Unknown entity type: ${entityType}`);
              continue;
          }

          if (apiResponse.isSuccess()) {
            const data = apiResponse.data || [];
            logger.debug(`useEntityFeed: Found ${data.length} ${entityType} entities`, {
              tagId,
              search,
              firstFew: data.slice(0, 3).map(item => ({ id: item.id, name: item.name || item.title || item.content?.substring(0, 50) }))
            });
            
            // Transform to Entity format
            const entities: Entity[] = data.map((item: any) => ({
              id: item.id,
              name: item.name || item.title || `${item.first_name} ${item.last_name}`.trim() || 'Untitled',
              description: item.description || item.bio || item.content || '',
              entityType,
              tags: item.tags || [],
              ...item
            }));
            
            allEntities.push(...entities);
          } else {
            logger.error(`Failed to fetch ${entityType} entities:`, apiResponse.error);
          }
        } catch (error) {
          logger.error(`Error fetching ${entityType} entities:`, error);
        }
      }

      // Sort by creation date (newest first) and apply limit
      const sortedEntities = allEntities
        .sort((a, b) => {
          const aDate = new Date(a.created_at || 0);
          const bDate = new Date(b.created_at || 0);
          return bDate.getTime() - aDate.getTime();
        })
        .slice(0, limit);

      logger.debug(`useEntityFeed: Returning ${sortedEntities.length} total entities`, {
        breakdown: entityTypes.reduce((acc, type) => {
          acc[type] = sortedEntities.filter(e => e.entityType === type).length;
          return acc;
        }, {} as Record<string, number>)
      });

      return sortedEntities;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: entityTypes.length > 0
  });
};
