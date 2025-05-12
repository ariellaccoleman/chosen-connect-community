
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
      type
    }: {
      name: string;
      description?: string | null;
      type: string;
    }) => {
      if (!user?.id) throw new Error("User must be authenticated");
      
      // Call the findOrCreateTag function with the correct parameters
      const tag = await findOrCreateTagUtil({
        name,
        description,
        type,
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
    findOrCreateTag: async (params: Parameters<typeof findOrCreateTagMutation.mutateAsync>[0]): Promise<Tag | null> => {
      try {
        const result = await findOrCreateTagMutation.mutateAsync(params);
        return result;
      } catch (error) {
        console.error("Error in findOrCreateTag:", error);
        return null;
      }
    },
    isCreating: findOrCreateTagMutation.isPending
  };
};
