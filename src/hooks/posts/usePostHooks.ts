
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  postsApiExtended as postsApi, 
  commentsApiExtended as commentsApi, 
  postLikesApiExtended as postLikesApi, 
  commentLikesApiExtended as commentLikesApi
} from "@/api/posts";
import { CreatePostRequest, CreateCommentRequest } from "@/types/post";
import { toast } from "sonner";

// Query keys
const POSTS_KEY = "posts";
const POST_KEY = "post";
const COMMENTS_KEY = "comments";
const POST_LIKES_KEY = "post-likes";
const COMMENT_LIKES_KEY = "comment-likes";

/**
 * Hook to fetch all posts with details (author info, likes, comments, tags)
 */
export const usePosts = () => {
  return useQuery({
    queryKey: [POSTS_KEY],
    queryFn: async () => {
      const result = await postsApi.getPostsWithDetails();
      if (result.error) {
        throw new Error(result.error.message || "Failed to fetch posts");
      }
      // Return the ApiResponse format that components expect
      return result;
    }
  });
};

/**
 * Hook to fetch a post by ID with all details
 */
export const usePost = (postId: string) => {
  return useQuery({
    queryKey: [POST_KEY, postId],
    queryFn: async () => {
      const result = await postsApi.getPostWithDetails(postId);
      if (result.error) {
        throw new Error(result.error.message || "Failed to fetch post");
      }
      return result;
    },
    enabled: !!postId
  });
};

/**
 * Hook to fetch comments for a specific post
 */
export const usePostComments = (postId: string, options = {}) => {
  return useQuery({
    queryKey: [COMMENTS_KEY, postId],
    queryFn: async () => {
      const result = await commentsApi.getCommentsForPost(postId);
      if (result.error) {
        throw new Error(result.error.message || "Failed to fetch comments");
      }
      // Return the ApiResponse format that components expect
      return result;
    },
    enabled: !!postId,
    ...options
  });
};

/**
 * Hook to check if the current user has liked a post
 */
export const useHasLikedPost = (postId: string) => {
  return useQuery({
    queryKey: [POST_LIKES_KEY, 'has-liked', postId],
    queryFn: async () => {
      const result = await postLikesApi.hasLiked(postId);
      if (result.error) {
        throw new Error(result.error.message || "Failed to check like status");
      }
      // Return the ApiResponse format that components expect
      return result;
    },
    enabled: !!postId
  });
};

/**
 * Hook to check if the current user has liked a comment
 */
export const useHasLikedComment = (commentId: string) => {
  return useQuery({
    queryKey: [COMMENT_LIKES_KEY, 'has-liked', commentId],
    queryFn: async () => {
      const result = await commentLikesApi.hasLiked(commentId);
      if (result.error) {
        throw new Error(result.error.message || "Failed to check comment like status");
      }
      // Return the ApiResponse format that components expect
      return result;
    },
    enabled: !!commentId
  });
};

/**
 * Hook to create a new post with optional tags
 */
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreatePostRequest) => {
      const result = await postsApi.createPostWithTags(data);
      if (result.error) {
        throw new Error(result.error.message || "Failed to create post");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POSTS_KEY] });
      toast("Your post has been published");
    },
    onError: (error: any) => {
      toast.error(error.message || "An error occurred");
    }
  });
};

/**
 * Hook to create a new comment on a post
 */
export const useCreateComment = (postId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateCommentRequest) => {
      const result = await commentsApi.createComment(data);
      if (result.error) {
        throw new Error(result.error.message || "Failed to create comment");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMMENTS_KEY, postId] });
      queryClient.invalidateQueries({ queryKey: [POST_KEY, postId] });
      queryClient.invalidateQueries({ queryKey: [POSTS_KEY] });
      toast("Your comment has been posted");
    },
    onError: (error: any) => {
      toast.error(error.message || "An error occurred");
    }
  });
};

/**
 * Hook to toggle like on a post
 */
export const useTogglePostLike = (postId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const result = await postLikesApi.toggleLike(postId);
      if (result.error) {
        throw new Error(result.error.message || "Failed to toggle like");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POST_LIKES_KEY, 'has-liked', postId] });
      queryClient.invalidateQueries({ queryKey: [POST_KEY, postId] });
      queryClient.invalidateQueries({ queryKey: [POSTS_KEY] });
    },
    onError: (error: any) => {
      toast.error(error.message || "An error occurred");
    }
  });
};

/**
 * Hook to toggle like on a comment
 */
export const useToggleCommentLike = (commentId: string, postId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const result = await commentLikesApi.toggleLike(commentId);
      if (result.error) {
        throw new Error(result.error.message || "Failed to toggle comment like");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMMENT_LIKES_KEY, 'has-liked', commentId] });
      queryClient.invalidateQueries({ queryKey: [COMMENTS_KEY, postId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "An error occurred");
    }
  });
};
