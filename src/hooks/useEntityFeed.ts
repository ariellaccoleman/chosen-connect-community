
import { useState, useEffect, useMemo } from "react";
import { Entity } from "@/types/entity";
import { EntityType } from "@/types/entityTypes";
import { useFilterTags, useSelectionTags } from "@/hooks/tags"; // Updated import
import { useEvents } from "./useEvents";
import { useCommunityProfiles } from "@/hooks/profiles"; // Fixed import path
import { useOrganizations } from "./organizations";
import { useEntityRegistry } from "./useEntityRegistry";

interface UseEntityFeedOptions {
  entityTypes?: EntityType[];
  tagId?: string;
  limit?: number;
  searchQuery?: string;
}

/**
 * Hook for fetching and filtering entities from multiple sources
 */
export const useEntityFeed = (options: UseEntityFeedOptions = {}) => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const { toEntity } = useEntityRegistry();
  
  const entityTypes = options.entityTypes || Object.values(EntityType);
  const includeEvents = entityTypes.includes(EntityType.EVENT);
  const includeProfiles = entityTypes.includes(EntityType.PERSON);
  const includeOrgs = entityTypes.includes(EntityType.ORGANIZATION);
  
  // Fetch data for each entity type
  const { data: eventsData = [], isLoading: eventsLoading } = useEvents(); 
  const events = Array.isArray(eventsData) ? eventsData : [];
  
  const { data: profiles = [], isLoading: profilesLoading } = useCommunityProfiles({
    search: options.searchQuery,
    limit: options.limit,
    tagId: options.tagId || selectedTagId
  });
  
  const { data: organizationsResponse, isLoading: orgsLoading } = useOrganizations();
  const organizations = organizationsResponse?.data || [];
  
  // Use tag hooks directly
  const { data: tagAssignments = [], isLoading: isTagsLoading } = useFilterTags(selectedTagId);
  
  // If tagId is provided in options, set it as the selected tag
  useEffect(() => {
    if (options.tagId) {
      setSelectedTagId(options.tagId);
    }
  }, [options.tagId]);
  
  // Filter items by tag using the assignments from useFilterTags
  const filterItemsByTag = useMemo(() => {
    return (items: Entity[]): Entity[] => {
      if (!selectedTagId) return items;
      
      // If we have tag assignments, filter items by matching IDs
      if (tagAssignments.length > 0) {
        const taggedIds = new Set(tagAssignments.map((ta) => ta.target_id));
        return items.filter(item => taggedIds.has(item.id));
      }
      
      return [];
    };
  }, [selectedTagId, tagAssignments]);
  
  // Combine and convert entities
  useEffect(() => {
    const allEntities: Entity[] = [];
    
    try {
      // Convert and add events
      if (includeEvents) {
        events.forEach(event => {
          const entity = toEntity(event, EntityType.EVENT);
          if (entity) allEntities.push(entity);
        });
      }
      
      // Convert and add profiles
      if (includeProfiles) {
        profiles.forEach(profile => {
          const entity = toEntity(profile, EntityType.PERSON);
          if (entity) allEntities.push(entity);
        });
      }
      
      // Convert and add organizations
      if (includeOrgs) {
        organizations.forEach(org => {
          const entity = toEntity(org, EntityType.ORGANIZATION);
          if (entity) allEntities.push(entity);
        });
      }
      
      // Filter by tag if needed
      const filteredEntities = selectedTagId 
        ? filterItemsByTag(allEntities)
        : allEntities;
      
      // Sort entities by created_at (newest first)
      const sortedEntities = filteredEntities.sort((a, b) => {
        if (!a.created_at || !b.created_at) return 0;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      // Limit the number of entities if specified
      const limitedEntities = options.limit 
        ? sortedEntities.slice(0, options.limit)
        : sortedEntities;
      
      setEntities(limitedEntities);
      setError(null);
    } catch (err) {
      console.error("Error processing entities:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
    
    setIsLoading(eventsLoading || profilesLoading || orgsLoading);
  }, [
    events, 
    profiles, 
    organizations, 
    eventsLoading, 
    profilesLoading, 
    orgsLoading,
    selectedTagId,
    includeEvents,
    includeProfiles,
    includeOrgs,
    options.limit,
    filterItemsByTag,
    toEntity,
    tagAssignments
  ]);
  
  return {
    entities,
    isLoading: isLoading || isTagsLoading,
    error,
    selectedTagId,
    setSelectedTagId
  };
};
