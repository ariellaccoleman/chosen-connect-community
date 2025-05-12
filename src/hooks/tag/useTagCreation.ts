
import { useTagFindOrCreate } from "./useTagFindOrCreate";
import { useTagEntityType } from "./useTagEntityType";
import { Tag } from "@/utils/tags";
import { toast } from "@/components/ui/sonner";

interface UseTagCreationOptions {
  onTagCreated?: (tag: Tag) => void;
}

/**
 * Hook for creating new tags with proper entity type assignment
 */
export const useTagCreation = (options: UseTagCreationOptions = {}) => {
  const { findOrCreateTag, isCreating } = useTagFindOrCreate();
  const { updateTagEntityType, isUpdatingEntityType } = useTagEntityType();

  const createTag = async (
    formValues: {
      name: string;
      description?: string | null;
    },
    entityType: "person" | "organization"
  ) => {
    try {
      // First create the tag
      const tag = await findOrCreateTag({
        name: formValues.name,
        description: formValues.description || null,
        type: entityType
      });

      if (!tag) {
        toast.error("Failed to create tag");
        return null;
      }

      // Next, ensure the tag is associated with the correct entity type
      await updateTagEntityType({
        tagId: tag.id,
        entityType
      });

      toast.success(`Tag "${tag.name}" created successfully`);

      // Call the optional callback
      if (options.onTagCreated) {
        options.onTagCreated(tag);
      }

      return tag;
    } catch (error) {
      console.error("Error creating tag:", error);
      toast.error(`Failed to create tag: ${error instanceof Error ? error.message : "Unknown error"}`);
      return null;
    }
  };

  return {
    createTag,
    isCreating: isCreating || isUpdatingEntityType
  };
};
