
import { useState } from "react";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";
import { useTagMutations } from "@/hooks/useTags";
import { Tag, TAG_TYPES } from "@/utils/tags";
import { TagFormValues } from "@/components/tags/TagSelector/TagForm";

interface UseTagCreationOptions {
  onTagCreated?: (tag: Tag) => void;
  onError?: (error: Error) => void;
}

export const useTagCreation = (options?: UseTagCreationOptions) => {
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();
  const { findOrCreateTag } = useTagMutations();

  const createTag = async (
    values: TagFormValues, 
    targetType: "person" | "organization"
  ) => {
    if (!user?.id) {
      toast.error("You must be logged in to create tags");
      return null;
    }

    setIsCreating(true);
    try {
      const newTag = await new Promise<Tag | null>((resolve, reject) => {
        findOrCreateTag({
          name: values.name,
          description: values.description || null,
          type: targetType === "person" ? TAG_TYPES.PERSON : TAG_TYPES.ORGANIZATION,
          isPublic: values.is_public,
        }, {
          onSuccess: (tag) => {
            if (tag) {
              resolve(tag);
            } else {
              reject(new Error("Failed to create tag"));
            }
          },
          onError: (error) => {
            reject(error instanceof Error ? error : new Error("Unknown error"));
          }
        });
      });

      if (newTag) {
        toast.success(`Tag "${values.name}" created successfully`);
        options?.onTagCreated?.(newTag);
        return newTag;
      }
      return null;
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      console.error("Error creating tag:", err);
      toast.error(`Failed to create tag: ${err.message}`);
      options?.onError?.(err);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createTag,
    isCreating
  };
};
