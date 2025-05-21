
import { useQuery } from "@tanstack/react-query";
import { EntityType } from "@/types/entityTypes";
import { Entity } from "@/types/entityRegistry";
import { apiClient } from "@/api/core/apiClient";
import { logger } from "@/utils/logger";
import { useEntityRegistry } from "./useEntityRegistry";
import { useState } from "react";
import { useSelectionTags, useFilterByTag } from "./tags";

interface EntityFeedOptions {
  entityTypes?: EntityType[];
  limit?: number;
  tagId?: string | null;
  userId?: string;
  excludeIds?: string[];
  sortBy?: 'created_at' | 'updated_at' | 'name';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Hook to fetch a feed of entities across multiple entity types
 */
export const useEntityFeed = ({
  entityTypes = Object.values(EntityType),
  limit,
  tagId = null,
  userId,
  excludeIds = [],
  sortBy = 'created_at',
  sortDirection = 'desc'
}: EntityFeedOptions) => {
  const { toEntity } = useEntityRegistry();
  const [selectedTagId, setSelectedTagId] = useState<string | null>(tagId);
  
  // Fetch tags for filtering
  const { data: tagsResponse } = useSelectionTags(
    entityTypes.length === 1 ? entityTypes[0] : undefined
  );
  const tags = tagsResponse?.data || [];
  
  // Add the useFilterByTag hook for entity filtering by tag
  const { data: tagFilteredEntities = { data: [] } } = useFilterByTag(
    selectedTagId,
    entityTypes.length === 1 ? entityTypes[0] : undefined
  );
  
  const queryKey = ['entityFeed', entityTypes, limit, selectedTagId, userId, excludeIds, sortBy, sortDirection];
  
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      logger.debug('Fetching entity feed with options:', {
        entityTypes,
        limit,
        tagId: selectedTagId,
        userId,
        excludeIds,
        sortBy,
        sortDirection
      });
      
      // If we have a selected tag, return the filtered entities
      if (selectedTagId && tagFilteredEntities.data.length > 0) {
        return tagFilteredEntities.data;
      }
      
      // Fetch entities for each type
      const entityPromises = entityTypes.map(async (entityType) => {
        try {
          // Build query based on entity type
          const { data, error } = await apiClient.query(async (client) => {
            let query = client
              .from(getTableForEntityType(entityType))
              .select('*');
            
            // Apply user filter if provided
            if (userId && hasUserField(entityType)) {
              query = query.eq('user_id', userId);
            }
            
            // Apply exclusions
            if (excludeIds.length > 0) {
              query = query.not('id', 'in', `(${excludeIds.join(',')})`);
            }
            
            // Apply sorting
            query = query.order(sortBy, { ascending: sortDirection === 'asc' });
            
            // Apply limit if provided
            if (limit) {
              query = query.limit(limit);
            }
            
            return query;
          });
          
          if (error) {
            logger.error(`Error fetching ${entityType} entities:`, error);
            return [];
          }
          
          // Convert to unified entity format
          return data.map((item: any) => {
            try {
              const entity = toEntity(item, entityType);
              return {
                ...entity,
                entityType // Add entityType for easier filtering
              };
            } catch (e) {
              logger.error(`Error converting ${entityType} to entity:`, e);
              return null;
            }
          }).filter(Boolean);
          
        } catch (e) {
          logger.error(`Error in entity feed for ${entityType}:`, e);
          return [];
        }
      });
      
      // Wait for all entity types to be fetched
      const entityArrays = await Promise.all(entityPromises);
      
      // Flatten and sort the combined results
      const allEntities = entityArrays.flat();
      
      // Sort combined results
      const sortedEntities = allEntities.sort((a, b) => {
        const aValue = a[sortBy] || a.createdAt || a.created_at || '';
        const bValue = b[sortBy] || b.createdAt || b.created_at || '';
        
        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
      
      // Apply final limit if needed
      return limit ? sortedEntities.slice(0, limit) : sortedEntities;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  return {
    entities: data || [],
    isLoading,
    error,
    selectedTagId,
    setSelectedTagId,
    tags
  };
};

/**
 * Helper function to get the database table name for an entity type
 */
function getTableForEntityType(entityType: EntityType): string {
  switch (entityType) {
    case EntityType.PERSON:
      return 'profiles';
    case EntityType.ORGANIZATION:
      return 'organizations';
    case EntityType.EVENT:
      return 'events';
    case EntityType.HUB:
      return 'hubs';
    case EntityType.POST:
      return 'posts';
    case EntityType.CHAT:
      return 'chat_channels';
    case EntityType.GUIDE:
      return 'guides';
    default:
      return entityType as string;
  }
}

/**
 * Helper function to check if an entity type has a user_id field
 */
function hasUserField(entityType: EntityType): boolean {
  return [
    EntityType.PERSON,
    EntityType.ORGANIZATION,
    EntityType.EVENT,
    EntityType.POST
  ].includes(entityType);
}
