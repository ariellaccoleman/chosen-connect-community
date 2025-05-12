
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../useAuth";
import { 
  Tag, 
  findOrCreateTag as findOrCreateTagUtil,
  invalidateTagCache
} from "@/utils/tags";
import { toast } from "@/components/ui/sonner";

/**
 * Hook for finding or creating tags
 */
export const useTagFindOrCreate = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Find or Create tag mutation
  const findOrCreateTagMutation = useMutation({
    mutationFn: async ({ 
      name, 
      description = null, 
      type, 
      isPublic = false
    }: {
      name: string;
      description?: string | null;
      type: string;
      isPublic?: boolean;
    }) => {
      if (!user?.id) throw new Error("User must be authenticated");
      
      // Call the findOrCreateTag function with the correct parameters
      const tag = await findOrCreateTagUtil({
        name,
        description,
        type,
        is_public: isPublic,
        created_by: user.id
      });
      
      if (!tag) {
        throw new Error("Failed to find or create tag");
      }
      
      return tag;
    },
    onSuccess: (data, variables) => {
      console.log("Tag found or created successfully:", data);
      
      // Invalidate all tag queries since new tag could affect any of them
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      
      // Also clear any cached tag data from the server
      invalidateTagCache(variables.type === "person" ? "person" : "organization" as "person" | "organization");
    },
    onError: (error) => {
      console.error("Error in findOrCreateTagMutation:", error);
      toast.error(`Failed to create tag: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });

  return {
    findOrCreateTag: (params: Parameters<typeof findOrCreateTagMutation.mutate>[0], options?: {
      onSuccess?: (data: Tag) => void;
      onError?: (error: any) => void;
    }) => {
      return findOrCreateTagMutation.mutate(params, {
        onSuccess: (data) => options?.onSuccess?.(data),
        onError: (error) => options?.onError?.(error)
      });
    },
    isCreating: findOrCreateTagMutation.isPending
  };
};
