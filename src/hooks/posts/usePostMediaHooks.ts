
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { postMediaApi } from "@/api/posts";
import { CreatePostMediaPayload } from "@/types/post";
import { showErrorToast } from "@/api/core";
import { logger } from "@/utils/logger";
import { toast } from "@/components/ui/use-toast";

/**
 * Hook to fetch media for a specific post
 */
export const usePostMedia = (postId: string) => {
  return useQuery({
    queryKey: ['postMedia', postId],
    queryFn: async () => {
      const response = await postMediaApi.getMediaByPostId(postId);
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.data || [];
    },
    enabled: !!postId
  });
};

/**
 * Hook to add media to a post
 */
export const useAddPostMedia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: CreatePostMediaPayload) => {
      const response = await postMediaApi.addMediaToPost(payload);
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['postMedia', variables.post_id] });
      queryClient.invalidateQueries({ queryKey: ['posts', variables.post_id] });
    },
    onError: (error) => {
      logger.error("Error adding media to post:", error);
      toast({
        variant: "destructive",
        description: showErrorToast(error, 'Failed to add media'),
      });
    }
  });
};

/**
 * Hook to delete media from a post
 */
export const useDeletePostMedia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ mediaId, postId }: { mediaId: string, postId: string }) => {
      const response = await postMediaApi.deleteMedia(mediaId);
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return { mediaId, postId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['postMedia', result.postId] });
      queryClient.invalidateQueries({ queryKey: ['posts', result.postId] });
    },
    onError: (error) => {
      logger.error("Error deleting media:", error);
      toast({
        variant: "destructive",
        description: showErrorToast(error, 'Failed to delete media'),
      });
    }
  });
};
