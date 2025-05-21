
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  postsApi, 
  commentsApi, 
  postLikesApi, 
  commentLikesApi,
  getAllPosts,
  getPostById
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
    queryFn: () => postsApi.getPostsWithDetails()
  });
};

/**
 * Hook to fetch a post by ID with all details
 */
export const usePost = (postId: string) => {
  return useQuery({
    queryKey: [POST_KEY, postId],
    queryFn: () => postsApi.getPostWithDetails(postId),
    enabled: !!postId
  });
};

/**
 * Hook to fetch comments for a specific post
 */
export const usePostComments = (postId: string, options = {}) => {
  return useQuery({
    queryKey: [COMMENTS_KEY, postId],
    queryFn: () => commentsApi.getCommentsForPost(postId),
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
    queryFn: () => postLikesApi.hasLiked(postId),
    enabled: !!postId
  });
};

/**
 * Hook to check if the current user has liked a comment
 */
export const useHasLikedComment = (commentId: string) => {
  return useQuery({
    queryKey: [COMMENT_LIKES_KEY, 'has-liked', commentId],
    queryFn: () => commentLikesApi.hasLiked(commentId),
    enabled: !!commentId
  });
};

/**
 * Hook to create a new post with optional tags
 */
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePostRequest) => postsApi.createPostWithTags(data),
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
    mutationFn: (data: CreateCommentRequest) => commentsApi.createComment(data),
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
    mutationFn: () => postLikesApi.toggleLike(postId),
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
    mutationFn: () => commentLikesApi.toggleLike(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMMENT_LIKES_KEY, 'has-liked', commentId] });
      queryClient.invalidateQueries({ queryKey: [COMMENTS_KEY, postId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "An error occurred");
    }
  });
};
