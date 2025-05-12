
import { useTagFindOrCreate } from "./useTagFindOrCreate";
import { useTagEntityType } from "./useTagEntityType";
import { useTagBasicCrud } from "./useTagBasicCrud";
import { Tag } from "@/utils/tags";

/**
 * Combined hook for tag CRUD operations
 * Provides mutations for finding/creating, updating, and deleting tags
 */
export const useTagCrudMutations = () => {
  const { findOrCreateTag, isCreating: isFindOrCreating } = useTagFindOrCreate();
  const { updateTagEntityType } = useTagEntityType();
  const { 
    createTag, 
    updateTag, 
    deleteTag,
    isCreating: isBasicCreating,
    isUpdating,
    isDeleting
  } = useTagBasicCrud();

  return {
    findOrCreateTag,
    updateTagEntityType,
    createTag,
    updateTag,
    deleteTag,
    isCreating: isFindOrCreating || isBasicCreating,
    isUpdating,
    isDeleting
  };
};
