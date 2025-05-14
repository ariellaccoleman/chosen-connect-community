import { useState, useEffect } from "react";
import { Entity, toEntity } from "@/types/entity";
import { EntityType } from "@/types/entityTypes";
import { useFilterTags } from "./useTagQueries";
import { useTagFilter } from "./useTagFilter";
import { useEvents } from "./useEvents";
import { useCommunityProfiles } from "./useCommunityProfiles";
import { useOrganizations } from "./useOrganizationQueries";

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
    tagId: options.tagId
  });
  
  const { data: organizationsResponse, isLoading: orgsLoading } = useOrganizations();
  const organizations = organizationsResponse?.data || [];
  
  // Set up tag filtering
  const { selectedTagId, setSelectedTagId, filterItemsByTag } = useTagFilter({
    entityType: undefined // Don't filter by a specific entity type since we're handling multiple types
  });
  
  // If tagId is provided in options, set it as the selected tag
  useEffect(() => {
    if (options.tagId) {
      setSelectedTagId(options.tagId);
    }
  }, [options.tagId, setSelectedTagId]);
  
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
    filterItemsByTag
  ]);
  
  return {
    entities,
    isLoading,
    error,
    selectedTagId,
    setSelectedTagId
  };
};
