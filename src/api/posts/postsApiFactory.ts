
import { createApiFactory } from '../core/factory/apiFactory';
import { Post, PostCreate, PostUpdate, PostWithDetails } from '@/types/post';
import { apiClient } from '../core/apiClient';
import { createSuccessResponse, createErrorResponse, ApiResponse } from '../core/errorHandler';
import { logger } from '@/utils/logger';

// Create the main posts API using the factory
export const postsApi = createApiFactory<Post, string, PostCreate, PostUpdate>({
  tableName: 'posts',
  entityName: 'post',
  defaultOrderBy: 'created_at',
  transformResponse: (data: any) => ({
    id: data.id,
    content: data.content,
    author_id: data.author_id,
    has_media: data.has_media || false,
    created_at: data.created_at,
    updated_at: data.updated_at
  }),
  transformRequest: (data: PostCreate | PostUpdate) => ({
    content: data.content,
    author_id: data.author_id,
    has_media: data.has_media || false
  }),
  useMutationOperations: true,
  useBatchOperations: false
});

// Create the post comments API
export const postCommentsApi = createApiFactory<any, string>({
  tableName: 'post_comments',
  entityName: 'postComment',
  defaultOrderBy: 'created_at',
  transformResponse: (data: any) => ({
    id: data.id,
    content: data.content,
    post_id: data.post_id,
    author_id: data.author_id,
    created_at: data.created_at,
    updated_at: data.updated_at
  }),
  useMutationOperations: true,
  useBatchOperations: false
});

// Create the post likes API
export const postLikesApi = createApiFactory<any, string>({
  tableName: 'post_likes',
  entityName: 'postLike',
  defaultOrderBy: 'created_at',
  transformResponse: (data: any) => ({
    id: data.id,
    post_id: data.post_id,
    user_id: data.user_id,
    created_at: data.created_at
  }),
  useMutationOperations: true,
  useBatchOperations: false
});

// Create the comment likes API
export const commentLikesApi = createApiFactory<any, string>({
  tableName: 'comment_likes',
  entityName: 'commentLike',
  defaultOrderBy: 'created_at',
  transformResponse: (data: any) => ({
    id: data.id,
    comment_id: data.comment_id,
    user_id: data.user_id,
    created_at: data.created_at
  }),
  useMutationOperations: true,
  useBatchOperations: false
});

/**
 * Get posts with full details including author, likes, and comments
 */
export const getPostsWithDetails = async (
  limit = 10,
  offset = 0,
  client?: any
): Promise<ApiResponse<PostWithDetails[]>> => {
  return apiClient.query(async (supabase) => {
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(
            id, first_name, last_name, avatar_url
          ),
          post_likes(id, user_id),
          post_comments(
            id, content, author_id, created_at,
            author:profiles!post_comments_author_id_fkey(
              id, first_name, last_name, avatar_url
            ),
            comment_likes(id, user_id)
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Error fetching posts with details:', error);
        return createErrorResponse(error);
      }

      const transformedPosts: PostWithDetails[] = (posts || []).map((post: any) => ({
        id: post.id,
        content: post.content,
        author_id: post.author_id,
        has_media: post.has_media || false,
        created_at: post.created_at,
        updated_at: post.updated_at,
        author: post.author,
        likes: post.post_likes || [],
        comments: (post.post_comments || []).map((comment: any) => ({
          ...comment,
          likes: comment.comment_likes || []
        }))
      }));

      return createSuccessResponse(transformedPosts);
    } catch (error) {
      logger.error('Exception in getPostsWithDetails:', error);
      return createErrorResponse(error);
    }
  }, client);
};

/**
 * Get a single post with full details
 */
export const getPostWithDetails = async (
  postId: string,
  client?: any
): Promise<ApiResponse<PostWithDetails>> => {
  return apiClient.query(async (supabase) => {
    try {
      const { data: post, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(
            id, first_name, last_name, avatar_url
          ),
          post_likes(id, user_id),
          post_comments(
            id, content, author_id, created_at,
            author:profiles!post_comments_author_id_fkey(
              id, first_name, last_name, avatar_url
            ),
            comment_likes(id, user_id)
          )
        `)
        .eq('id', postId)
        .single();

      if (error) {
        logger.error('Error fetching post with details:', error);
        return createErrorResponse(error);
      }

      const transformedPost: PostWithDetails = {
        id: post.id,
        content: post.content,
        author_id: post.author_id,
        has_media: post.has_media || false,
        created_at: post.created_at,
        updated_at: post.updated_at,
        author: post.author,
        likes: post.post_likes || [],
        comments: (post.post_comments || []).map((comment: any) => ({
          ...comment,
          likes: comment.comment_likes || []
        }))
      };

      return createSuccessResponse(transformedPost);
    } catch (error) {
      logger.error('Exception in getPostWithDetails:', error);
      return createErrorResponse(error);
    }
  }, client);
};

/**
 * Reset posts APIs with authenticated client
 */
export const resetPostsApi = (client?: any) => {
  const newPostsApi = createApiFactory<Post, string, PostCreate, PostUpdate>({
    tableName: 'posts',
    entityName: 'post',
    defaultOrderBy: 'created_at',
    transformResponse: (data: any) => ({
      id: data.id,
      content: data.content,
      author_id: data.author_id,
      has_media: data.has_media || false,
      created_at: data.created_at,
      updated_at: data.updated_at
    }),
    transformRequest: (data: PostCreate | PostUpdate) => ({
      content: data.content,
      author_id: data.author_id,
      has_media: data.has_media || false
    }),
    useMutationOperations: true,
    useBatchOperations: false
  }, client);

  const newPostCommentsApi = createApiFactory<any, string>({
    tableName: 'post_comments',
    entityName: 'postComment',
    defaultOrderBy: 'created_at',
    transformResponse: (data: any) => ({
      id: data.id,
      content: data.content,
      post_id: data.post_id,
      author_id: data.author_id,
      created_at: data.created_at,
      updated_at: data.updated_at
    }),
    useMutationOperations: true,
    useBatchOperations: false
  }, client);

  const newPostLikesApi = createApiFactory<any, string>({
    tableName: 'post_likes',
    entityName: 'postLike',
    defaultOrderBy: 'created_at',
    transformResponse: (data: any) => ({
      id: data.id,
      post_id: data.post_id,
      user_id: data.user_id,
      created_at: data.created_at
    }),
    useMutationOperations: true,
    useBatchOperations: false
  }, client);

  const newCommentLikesApi = createApiFactory<any, string>({
    tableName: 'comment_likes',
    entityName: 'commentLike',
    defaultOrderBy: 'created_at',
    transformResponse: (data: any) => ({
      id: data.id,
      comment_id: data.comment_id,
      user_id: data.user_id,
      created_at: data.created_at
    }),
    useMutationOperations: true,
    useBatchOperations: false
  }, client);

  return {
    postsApi: newPostsApi,
    postCommentsApi: newPostCommentsApi,
    postLikesApi: newPostLikesApi,
    commentLikesApi: newCommentLikesApi,
    getPostsWithDetails: (limit?: number, offset?: number) => 
      getPostsWithDetails(limit, offset, client),
    getPostWithDetails: (postId: string) => 
      getPostWithDetails(postId, client)
  };
};

// Export individual operations for direct usage
export const {
  getAll: getAllPosts,
  getById: getPostById,
  create: createPost,
  update: updatePost,
  delete: deletePost
} = postsApi;

export const {
  getAll: getAllPostComments,
  getById: getPostCommentById,
  create: createPostComment,
  update: updatePostComment,
  delete: deletePostComment
} = postCommentsApi;

export const {
  getAll: getAllPostLikes,
  getById: getPostLikeById,
  create: createPostLike,
  delete: deletePostLike
} = postLikesApi;

export const {
  getAll: getAllCommentLikes,
  getById: getCommentLikeById,
  create: createCommentLike,
  delete: deleteCommentLike
} = commentLikesApi;
