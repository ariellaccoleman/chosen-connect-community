
import { createApiFactory } from '../core/factory/apiFactory';

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
 * Reset post interaction APIs with authenticated client
 */
export const resetPostInteractionApis = (client?: any) => {
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
    postCommentsApi: newPostCommentsApi,
    postLikesApi: newPostLikesApi,
    commentLikesApi: newCommentLikesApi
  };
};
