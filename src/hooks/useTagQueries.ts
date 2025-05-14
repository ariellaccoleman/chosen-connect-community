
import { useQuery } from "@tanstack/react-query";
import { 
  Tag, 
  TagAssignment, 
  fetchFilterTags,
  fetchSelectionTags, 
  fetchEntityTags
} from "@/utils/tags";
import { EntityType, isValidEntityType } from "@/types/entityTypes";

// Common options for tag queries
interface TagQueryOptions {
  type?: string;
  createdBy?: string;
  searchQuery?: string;
  targetType?: EntityType;
  enabled?: boolean;
  skipCache?: boolean; // Option to bypass cache
}

// Hook for fetching tags for filtering lists (e.g. directory pages)
export const useFilterTags = (options: TagQueryOptions = {}) => {
  // Validate entity type if provided
  const validatedOptions = { ...options };
  
  return useQuery({
    queryKey: ["tags", "filter", validatedOptions],
    queryFn: () => fetchFilterTags(validatedOptions),
    enabled: validatedOptions.enabled !== false,
    retry: 1,
    meta: {
      onError: (error: any) => {
        console.error("Error in useFilterTags query:", error);
      }
    }
  });
};

// Hook for fetching tags for selection components (e.g. typeaheads)
export const useSelectionTags = (options: TagQueryOptions = {}) => {
  // Validate entity type if provided
  const validatedOptions = { ...options };
  
  return useQuery({
    queryKey: ["tags", "selection", validatedOptions],
    queryFn: () => fetchSelectionTags(validatedOptions),
    enabled: validatedOptions.enabled !== false,
    retry: 1,
    staleTime: validatedOptions.skipCache ? 0 : 5 * 60 * 1000, // 5 minutes cache unless skipCache is true
    meta: {
      onError: (error: any) => {
        console.error("Error in useSelectionTags query:", error);
      }
    }
  });
};

// Legacy hook that maintains backward compatibility
// Uses selection tags by default as that's closest to original behavior
export const useTags = (options: TagQueryOptions = {}) => {
  return useSelectionTags(options);
};

// Hook for fetching tags assigned to a specific entity
export const useEntityTags = (
  entityId?: string,
  entityType?: EntityType | string,
  options: { enabled?: boolean } = {}
) => {
  // Validate entity type if provided
  const validEntityType = entityType && isValidEntityType(entityType) 
    ? entityType 
    : entityType === "person" ? EntityType.PERSON 
    : entityType === "organization" ? EntityType.ORGANIZATION 
    : entityType === "event" ? EntityType.EVENT 
    : undefined;

  return useQuery({
    queryKey: ["entity-tags", entityId, validEntityType],
    queryFn: () => 
      entityId && validEntityType ? fetchEntityTags(entityId, validEntityType) : [],
    enabled: !!entityId && !!validEntityType && options.enabled !== false
  });
};

// Export as a collective object for easier imports
export const useTagQueries = {
  useFilterTags,
  useSelectionTags,
  useTags,
  useEntityTags
};
