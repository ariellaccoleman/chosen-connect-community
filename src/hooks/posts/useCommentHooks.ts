
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { postCommentApi } from "@/api/posts";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/utils/logger";
import { toast } from "@/components/ui/use-toast";

/**
 * Hook to fetch comments for a specific post
 */
export const usePostComments = (postId: string) => {
  return useQuery({
    queryKey: ['postComments', postId],
    queryFn: async () => {
      const response = await postCommentApi.getCommentsByPostId(postId);
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.data || [];
    },
    enabled: !!postId
  });
};

/**
 * Hook to create a new comment
 */
export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string, content: string }) => {
      if (!user) {
        throw new Error('You must be logged in to comment');
      }
      
      const response = await postCommentApi.createComment({
        post_id: postId,
        author_id: user.id,
        content
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['postComments', variables.postId] });
    },
    onError: (error) => {
      logger.error("Error creating comment:", error);
      toast({
        description: error instanceof Error ? error.message : 'Failed to create comment',
        variant: "destructive"
      });
    }
  });
};

/**
 * Hook to delete a comment
 */
export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string, postId: string }) => {
      const response = await postCommentApi.deleteComment(commentId);
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return { commentId, postId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['postComments', result.postId] });
      toast({
        description: 'Comment deleted successfully',
      });
    },
    onError: (error) => {
      logger.error("Error deleting comment:", error);
      toast({
        description: error instanceof Error ? error.message : 'Failed to delete comment',
        variant: "destructive"
      });
    }
  });
};

/**
 * Hook to check if user can delete a comment
 */
export const useCommentDeletePermission = (userId: string | undefined, commentId: string) => {
  return useQuery({
    queryKey: ['commentDeletePermission', userId, commentId],
    queryFn: async () => {
      if (!userId) return false;
      return await postCommentApi.checkDeletePermission(userId, commentId);
    },
    enabled: !!userId && !!commentId
  });
};
