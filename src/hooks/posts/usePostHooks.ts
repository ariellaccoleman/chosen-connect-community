
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { postApi } from "@/api/posts";
import { useAuth } from "@/hooks/useAuth";
import { CreatePostPayload, PostWithAuthor } from "@/types/post";
import { showErrorToast } from "@/api/core";
import { toast } from "@/components/ui/use-toast";
import { logger } from "@/utils/logger";

/**
 * Hook to fetch posts with author details
 */
export const usePosts = () => {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const response = await postApi.getPostsWithAuthor();
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.data || [];
    }
  });
};

/**
 * Hook to fetch a single post by ID with author details
 */
export const usePost = (postId: string) => {
  return useQuery({
    queryKey: ['posts', postId],
    queryFn: async () => {
      const response = await postApi.getPostById(postId);
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.data;
    },
    enabled: !!postId
  });
};

/**
 * Hook to fetch posts by tag
 */
export const usePostsByTag = (tagId: string | undefined) => {
  return useQuery({
    queryKey: ['posts', 'byTag', tagId],
    queryFn: async () => {
      if (!tagId) return [];
      
      const response = await postApi.getPostsByTag(tagId);
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.data || [];
    },
    enabled: !!tagId
  });
};

/**
 * Hook to create a new post
 */
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: Omit<CreatePostPayload, 'author_id'>) => {
      if (!user) {
        throw new Error('You must be logged in to create a post');
      }
      
      const payload: CreatePostPayload = {
        ...data,
        author_id: user.id
      };
      
      const response = await postApi.create(payload);
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({
        description: 'Post created successfully',
      });
    },
    onError: (error) => {
      logger.error("Error creating post:", error);
      toast({
        variant: "destructive",
        description: showErrorToast(error, 'Failed to create post'),
      });
    }
  });
};

/**
 * Hook to delete a post
 */
export const useDeletePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await postApi.delete(postId);
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({
        description: 'Post deleted successfully',
      });
    },
    onError: (error) => {
      logger.error("Error deleting post:", error);
      toast({
        variant: "destructive",
        description: showErrorToast(error, 'Failed to delete post'),
      });
    }
  });
};
