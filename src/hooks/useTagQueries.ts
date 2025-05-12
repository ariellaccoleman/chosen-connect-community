
import { useQuery } from "@tanstack/react-query";
import { 
  Tag, 
  TagAssignment, 
  fetchFilterTags,
  fetchSelectionTags, 
  fetchEntityTags
} from "@/utils/tags";

// Common options for tag queries
interface TagQueryOptions {
  type?: string;
  isPublic?: boolean;
  createdBy?: string;
  searchQuery?: string;
  targetType?: "person" | "organization";
  enabled?: boolean;
  skipCache?: boolean; // Option to bypass cache
}

// Hook for fetching tags for filtering lists (e.g. directory pages)
export const useFilterTags = (options: TagQueryOptions = {}) => {
  return useQuery({
    queryKey: ["tags", "filter", options],
    queryFn: () => fetchFilterTags(options),
    enabled: options.enabled !== false,
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
  return useQuery({
    queryKey: ["tags", "selection", options],
    queryFn: () => fetchSelectionTags(options),
    enabled: options.enabled !== false,
    retry: 1,
    staleTime: options.skipCache ? 0 : 5 * 60 * 1000, // 5 minutes cache unless skipCache is true
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
  entityType?: "person" | "organization",
  options: { enabled?: boolean } = {}
) => {
  return useQuery({
    queryKey: ["entity-tags", entityId, entityType],
    queryFn: () => 
      entityId && entityType ? fetchEntityTags(entityId, entityType) : [],
    enabled: !!entityId && !!entityType && options.enabled !== false
  });
};
