
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEntityTags } from "@/utils/tags";
import { EntityType, isValidEntityType } from "@/types/entityTypes";
import { useTagAssignmentMutations as useTagsMutations } from "./tag";
import { useTagCrudMutations } from "./tag";
import { useFilterTags, useSelectionTags, useEntityTags } from "./useTagQueries";

/**
 * Re-export query hooks from useTagQueries
 */
export { useFilterTags, useSelectionTags, useEntityTags };

/**
 * Main tag query hook for backward compatibility
 * Returns all tags that can be used for selection
 */
export const useTags = useSelectionTags;

/**
 * Re-export tag crud mutations for backward compatibility
 */
export const useTagMutations = useTagCrudMutations;

/**
 * Re-export assignment mutations hook for backward compatibility
 * This ensures all entity components using tag assignments
 * are using the same underlying code
 */
export const useTagAssignmentMutations = useTagsMutations;
