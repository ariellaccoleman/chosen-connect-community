
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
        author: post.author ? {
          id: post.author.id,
          name: `${post.author.first_name || ''} ${post.author.last_name || ''}`.trim() || 'Unknown',
          avatar: post.author.avatar_url
        } : {
          id: '',
          name: 'Unknown'
        },
        likes: post.post_likes || [],
        comments: (post.post_comments || []).map((comment: any) => ({
          ...comment,
          author: comment.author ? {
            id: comment.author.id,
            name: `${comment.author.first_name || ''} ${comment.author.last_name || ''}`.trim() || 'Unknown',
            avatar: comment.author.avatar_url
          } : {
            id: '',
            name: 'Unknown'
          },
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
        author: post.author ? {
          id: post.author.id,
          name: `${post.author.first_name || ''} ${post.author.last_name || ''}`.trim() || 'Unknown',
          avatar: post.author.avatar_url
        } : {
          id: '',
          name: 'Unknown'
        },
        likes: post.post_likes || [],
        comments: (post.post_comments || []).map((comment: any) => ({
          ...comment,
          author: comment.author ? {
            id: comment.author.id,
            name: `${comment.author.first_name || ''} ${comment.author.last_name || ''}`.trim() || 'Unknown',
            avatar: comment.author.avatar_url
          } : {
            id: '',
            name: 'Unknown'
          },
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

// Extended APIs with real implementations
const extendedPostsApi = {
  ...postsApi,
  getPostsWithDetails,
  getPostWithDetails,
  createPostWithTags: async (data: any) => {
    return apiClient.query(async (supabase) => {
      try {
        const { user } = await supabase.auth.getUser();
        if (!user.user) {
          return createErrorResponse(new Error('User not authenticated'));
        }

        const postData = {
          content: data.content,
          has_media: data.has_media || false,
          author_id: user.user.id
        };

        const result = await postsApi.create(postData);
        return result;
      } catch (error) {
        logger.error('Exception in createPostWithTags:', error);
        return createErrorResponse(error);
      }
    });
  }
};

const extendedPostLikesApi = {
  ...postLikesApi,
  hasLiked: async (postId: string) => {
    return apiClient.query(async (supabase) => {
      try {
        const { user } = await supabase.auth.getUser();
        if (!user.user) {
          return createSuccessResponse(false);
        }

        const { data, error } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          logger.error('Error checking like status:', error);
          return createErrorResponse(error);
        }

        return createSuccessResponse(!!data);
      } catch (error) {
        logger.error('Exception in hasLiked:', error);
        return createErrorResponse(error);
      }
    });
  },
  toggleLike: async (postId: string) => {
    return apiClient.query(async (supabase) => {
      try {
        const { user } = await supabase.auth.getUser();
        if (!user.user) {
          return createErrorResponse(new Error('User not authenticated'));
        }

        // Check if like exists
        const { data: existingLike, error: checkError } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.user.id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          logger.error('Error checking existing like:', checkError);
          return createErrorResponse(checkError);
        }

        if (existingLike) {
          // Remove like
          const { error: deleteError } = await supabase
            .from('post_likes')
            .delete()
            .eq('id', existingLike.id);

          if (deleteError) {
            logger.error('Error removing like:', deleteError);
            return createErrorResponse(deleteError);
          }

          return createSuccessResponse({ action: 'unliked' });
        } else {
          // Add like
          const { error: insertError } = await supabase
            .from('post_likes')
            .insert({
              post_id: postId,
              user_id: user.user.id
            });

          if (insertError) {
            logger.error('Error adding like:', insertError);
            return createErrorResponse(insertError);
          }

          return createSuccessResponse({ action: 'liked' });
        }
      } catch (error) {
        logger.error('Exception in toggleLike:', error);
        return createErrorResponse(error);
      }
    });
  }
};

const extendedCommentLikesApi = {
  ...commentLikesApi,
  hasLiked: async (commentId: string) => {
    return apiClient.query(async (supabase) => {
      try {
        const { user } = await supabase.auth.getUser();
        if (!user.user) {
          return createSuccessResponse(false);
        }

        const { data, error } = await supabase
          .from('comment_likes')
          .select('id')
          .eq('comment_id', commentId)
          .eq('user_id', user.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          logger.error('Error checking comment like status:', error);
          return createErrorResponse(error);
        }

        return createSuccessResponse(!!data);
      } catch (error) {
        logger.error('Exception in hasLiked (comment):', error);
        return createErrorResponse(error);
      }
    });
  },
  toggleLike: async (commentId: string) => {
    return apiClient.query(async (supabase) => {
      try {
        const { user } = await supabase.auth.getUser();
        if (!user.user) {
          return createErrorResponse(new Error('User not authenticated'));
        }

        // Check if like exists
        const { data: existingLike, error: checkError } = await supabase
          .from('comment_likes')
          .select('id')
          .eq('comment_id', commentId)
          .eq('user_id', user.user.id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          logger.error('Error checking existing comment like:', checkError);
          return createErrorResponse(checkError);
        }

        if (existingLike) {
          // Remove like
          const { error: deleteError } = await supabase
            .from('comment_likes')
            .delete()
            .eq('id', existingLike.id);

          if (deleteError) {
            logger.error('Error removing comment like:', deleteError);
            return createErrorResponse(deleteError);
          }

          return createSuccessResponse({ action: 'unliked' });
        } else {
          // Add like
          const { error: insertError } = await supabase
            .from('comment_likes')
            .insert({
              comment_id: commentId,
              user_id: user.user.id
            });

          if (insertError) {
            logger.error('Error adding comment like:', insertError);
            return createErrorResponse(insertError);
          }

          return createSuccessResponse({ action: 'liked' });
        }
      } catch (error) {
        logger.error('Exception in toggleLike (comment):', error);
        return createErrorResponse(error);
      }
    });
  }
};

const extendedCommentsApi = {
  ...commentsApi,
  getCommentsForPost: async (postId: string) => {
    return apiClient.query(async (supabase) => {
      try {
        const { data: comments, error } = await supabase
          .from('post_comments')
          .select(`
            *,
            author:profiles!post_comments_author_id_fkey(
              id, first_name, last_name, avatar_url
            ),
            comment_likes(id, user_id)
          `)
          .eq('post_id', postId)
          .order('created_at', { ascending: true });

        if (error) {
          logger.error('Error fetching comments:', error);
          return createErrorResponse(error);
        }

        const transformedComments = (comments || []).map((comment: any) => ({
          ...comment,
          author: comment.author ? {
            id: comment.author.id,
            name: `${comment.author.first_name || ''} ${comment.author.last_name || ''}`.trim() || 'Unknown',
            avatar: comment.author.avatar_url
          } : {
            id: '',
            name: 'Unknown'
          },
          likes: comment.comment_likes || []
        }));

        return createSuccessResponse(transformedComments);
      } catch (error) {
        logger.error('Exception in getCommentsForPost:', error);
        return createErrorResponse(error);
      }
    });
  },
  createComment: async (data: any) => {
    return apiClient.query(async (supabase) => {
      try {
        const { user } = await supabase.auth.getUser();
        if (!user.user) {
          return createErrorResponse(new Error('User not authenticated'));
        }

        const commentData = {
          post_id: data.post_id,
          content: data.content,
          author_id: user.user.id
        };

        const { data: comment, error } = await supabase
          .from('post_comments')
          .insert(commentData)
          .select(`
            *,
            author:profiles!post_comments_author_id_fkey(
              id, first_name, last_name, avatar_url
            )
          `)
          .single();

        if (error) {
          logger.error('Error creating comment:', error);
          return createErrorResponse(error);
        }

        const transformedComment = {
          ...comment,
          author: comment.author ? {
            id: comment.author.id,
            name: `${comment.author.first_name || ''} ${comment.author.last_name || ''}`.trim() || 'Unknown',
            avatar: comment.author.avatar_url
          } : {
            id: '',
            name: 'Unknown'
          }
        };

        return createSuccessResponse(transformedComment);
      } catch (error) {
        logger.error('Exception in createComment:', error);
        return createErrorResponse(error);
      }
    });
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
