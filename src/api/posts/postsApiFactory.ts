import { createApiFactory } from '../core/factory/apiFactory';
import { Post, PostCreate, PostUpdate, PostWithDetails } from '@/types/post';
import { apiClient } from '../core/apiClient';
import { createSuccessResponse, createErrorResponse, ApiResponse } from '../core/errorHandler';
import { logger } from '@/utils/logger';
import { ViewApiOperations } from '../core/types';

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
  transformRequest: (data: PostCreate | PostUpdate) => {
    const transformed: Record<string, any> = {
      content: data.content,
      has_media: data.has_media || false
    };
    
    // Only add author_id for PostCreate (not PostUpdate)
    if ('author_id' in data) {
      transformed.author_id = data.author_id;
    }
    
    return transformed;
  },
  useMutationOperations: true,
  useBatchOperations: false
});

// Create view operations for posts with tags using manual implementation
const createPostsWithTagsViewOperations = (): ViewApiOperations<Post & { tags?: any[], tag_names?: string[] }, string> => {
  return {
    viewName: 'posts_with_tags',
    
    async getAll(params = {}) {
      return apiClient.query(async (supabase) => {
        try {
          let query = supabase.from('posts_with_tags' as any).select('*');
          
          // Apply filters
          if (params.filters) {
            Object.entries(params.filters).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                  query = query.in(key, value);
                } else {
                  query = query.eq(key, value);
                }
              }
            });
          }
          
          // Apply search
          if (params.search && params.searchColumns?.length) {
            query = query.ilike(params.searchColumns[0], `%${params.search}%`);
          }
          
          // Apply ordering
          if (params.ascending !== undefined) {
            query = query.order('created_at', { ascending: params.ascending });
          } else {
            query = query.order('created_at', { ascending: false });
          }
          
          // Apply pagination
          if (params.limit !== undefined) {
            const from = params.offset || 0;
            const to = from + params.limit - 1;
            query = query.range(from, to);
          }
          
          const { data, error } = await query;
          
          if (error) throw error;
          
          const transformedData = (data || []).map((item: any) => ({
            id: item.id,
            content: item.content,
            author_id: item.author_id,
            has_media: item.has_media || false,
            created_at: item.created_at,
            updated_at: item.updated_at,
            tags: item.tags || [],
            tag_names: item.tag_names || []
          }));
          
          return createSuccessResponse(transformedData);
        } catch (error) {
          return createErrorResponse(error);
        }
      });
    },

    async getById(id) {
      return apiClient.query(async (supabase) => {
        try {
          const { data, error } = await supabase
            .from('posts_with_tags' as any)
            .select('*')
            .eq('id', id)
            .maybeSingle();
          
          if (error) throw error;
          
          const transformedData = data ? {
            id: data.id,
            content: data.content,
            author_id: data.author_id,
            has_media: data.has_media || false,
            created_at: data.created_at,
            updated_at: data.updated_at,
            tags: data.tags || [],
            tag_names: data.tag_names || []
          } : null;
          
          return createSuccessResponse(transformedData);
        } catch (error) {
          return createErrorResponse(error);
        }
      });
    },

    async getByIds(ids) {
      if (!ids.length) {
        return createSuccessResponse([]);
      }
      
      return apiClient.query(async (supabase) => {
        try {
          const { data, error } = await supabase
            .from('posts_with_tags' as any)
            .select('*')
            .in('id', ids);
          
          if (error) throw error;
          
          const transformedData = (data || []).map((item: any) => ({
            id: item.id,
            content: item.content,
            author_id: item.author_id,
            has_media: item.has_media || false,
            created_at: item.created_at,
            updated_at: item.updated_at,
            tags: item.tags || [],
            tag_names: item.tag_names || []
          }));
          
          return createSuccessResponse(transformedData);
        } catch (error) {
          return createErrorResponse(error);
        }
      });
    },

    async search(field, searchTerm) {
      return this.getAll({
        search: searchTerm,
        searchColumns: [field]
      });
    },

    async filterByTagNames(tagNames) {
      if (!tagNames || tagNames.length === 0) {
        return this.getAll();
      }

      return apiClient.query(async (supabase) => {
        try {
          const { data, error } = await supabase
            .from('posts_with_tags' as any)
            .select('*')
            .overlaps('tag_names', tagNames);
          
          if (error) throw error;
          
          const transformedData = (data || []).map((item: any) => ({
            id: item.id,
            content: item.content,
            author_id: item.author_id,
            has_media: item.has_media || false,
            created_at: item.created_at,
            updated_at: item.updated_at,
            tags: item.tags || [],
            tag_names: item.tag_names || []
          }));
          
          return createSuccessResponse(transformedData);
        } catch (error) {
          return createErrorResponse(error);
        }
      });
    }
  };
};

// Create the posts with tags view API
export const postsWithTagsApi = createPostsWithTagsViewOperations();

// Create the post comments API (alias as commentsApi for backwards compatibility)
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

// Export as commentsApi for backwards compatibility
export const commentsApi = postCommentsApi;

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

// Add extended APIs with custom methods
const extendedPostsApi = {
  ...postsApi,
  getPostsWithDetails,
  getPostWithDetails,
  createPostWithTags: async (data: any) => {
    // Placeholder for createPostWithTags functionality
    return postsApi.create(data);
  }
};

const extendedPostLikesApi = {
  ...postLikesApi,
  hasLiked: async (postId: string) => {
    // Placeholder for hasLiked functionality
    return createSuccessResponse(false);
  },
  toggleLike: async (postId: string) => {
    // Placeholder for toggleLike functionality
    return createSuccessResponse(true);
  }
};

const extendedCommentLikesApi = {
  ...commentLikesApi,
  hasLiked: async (commentId: string) => {
    // Placeholder for hasLiked functionality
    return createSuccessResponse(false);
  },
  toggleLike: async (commentId: string) => {
    // Placeholder for toggleLike functionality
    return createSuccessResponse(true);
  }
};

const extendedCommentsApi = {
  ...commentsApi,
  getCommentsForPost: async (postId: string) => {
    // Placeholder for getCommentsForPost functionality
    return commentsApi.getAll();
  },
  createComment: async (data: any) => {
    // Placeholder for createComment functionality
    return commentsApi.create(data);
  }
};

// Export the extended APIs
export { extendedPostsApi as postsApiExtended };
export { extendedPostLikesApi as postLikesApiExtended };
export { extendedCommentLikesApi as commentLikesApiExtended };
export { extendedCommentsApi as commentsApiExtended };

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
    transformRequest: (data: PostCreate | PostUpdate) => {
      const transformed: Record<string, any> = {
        content: data.content,
        has_media: data.has_media || false
      };
      
      // Only add author_id for PostCreate (not PostUpdate)
      if ('author_id' in data) {
        transformed.author_id = data.author_id;
      }
      
      return transformed;
    },
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

  const newPostsWithTagsApi = createApiFactory<Post & { tags?: any[], tag_names?: string[] }, string>({
    tableName: 'posts_with_tags',
    entityName: 'postWithTags',
    defaultOrderBy: 'created_at',
    transformResponse: (data: any) => ({
      id: data.id,
      content: data.content,
      author_id: data.author_id,
      has_media: data.has_media || false,
      created_at: data.created_at,
      updated_at: data.updated_at,
      tags: data.tags || [],
      tag_names: data.tag_names || []
    }),
    useMutationOperations: false,
    useBatchOperations: false
  }, client);

  return {
    postsApi: newPostsApi,
    postsWithTagsApi: newPostsWithTagsApi,
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
  getAll: getAllPostsWithTags,
  getById: getPostWithTagsById
} = postsWithTagsApi;

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
