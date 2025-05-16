
/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please update your imports to use the modular structure:
 * import { useFilterTags, useSelectionTags, useEntityTags, useTagAssignmentMutations } from '@/hooks/tags';
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEntityTags } from "@/utils/tags";
import { EntityType, isValidEntityType } from "@/types/entityTypes";
import { useTagAssignmentMutations as useTagsMutations } from "./tag";
import { useTagCrudMutations } from "./tag";
import { useFilterTags, useSelectionTags, useEntityTags } from "./useTagQueries";

/**
 * Re-export query hooks from useTagQueries
 * @deprecated Import these hooks directly from '@/hooks/tags'
 */
export { useFilterTags, useSelectionTags, useEntityTags };

/**
 * Main tag query hook for backward compatibility
 * Returns all tags that can be used for selection
 * @deprecated Use useSelectionTags from '@/hooks/tags' directly
 */
export const useTags = useSelectionTags;

/**
 * Re-export tag crud mutations for backward compatibility
 * @deprecated Use useTagCrudMutations from '@/hooks/tag' directly
 */
export const useTagMutations = useTagCrudMutations;

/**
 * Re-export assignment mutations hook for backward compatibility
 * @deprecated Use useTagAssignmentMutations from '@/hooks/tag' directly
 */
export const useTagAssignmentMutations = useTagsMutations;
