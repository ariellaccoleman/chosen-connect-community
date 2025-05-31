// Re-export from the new organized structure
export { postsTableApi as postsApi } from './postsTableApiFactory';
export { postsViewApi as postsWithTagsApi } from './postsViewApiFactory';
export { postCommentsApi, postLikesApi, commentLikesApi } from './postInteractionApiFactory';
export { postsCompositeApi } from './postsCompositeApiFactory';
export { getPostsWithDetails, getPostWithDetails } from './postsDetailedOperations';

// Export the composite API as the main interface
export { postsCompositeApi as postsApiExtended } from './postsCompositeApiFactory';

// Backwards compatibility exports
export const commentsApi = postCommentsApi;

// Extended APIs with placeholder methods for backwards compatibility
const extendedPostLikesApi = {
  ...postLikesApi,
  hasLiked: async (postId: string) => {
    // Placeholder for hasLiked functionality
    return { data: false, error: null, status: 'success' as const, isSuccess: () => true, isError: () => false };
  },
  toggleLike: async (postId: string) => {
    // Placeholder for toggleLike functionality
    return { data: true, error: null, status: 'success' as const, isSuccess: () => true, isError: () => false };
  }
};

const extendedCommentLikesApi = {
  ...commentLikesApi,
  hasLiked: async (commentId: string) => {
    // Placeholder for hasLiked functionality
    return { data: false, error: null, status: 'success' as const, isSuccess: () => true, isError: () => false };
  },
  toggleLike: async (commentId: string) => {
    // Placeholder for toggleLike functionality
    return { data: true, error: null, status: 'success' as const, isSuccess: () => true, isError: () => false };
  }
};

const extendedCommentsApi = {
  ...postCommentsApi,
  getCommentsForPost: async (postId: string) => {
    // Placeholder for getCommentsForPost functionality
    return postCommentsApi.getAll();
  },
  createComment: async (data: any) => {
    // Placeholder for createComment functionality
    return postCommentsApi.create(data);
  }
};

// Export extended APIs for backwards compatibility
export { extendedPostLikesApi as postLikesApiExtended };
export { extendedCommentLikesApi as commentLikesApiExtended };
export { extendedCommentsApi as commentsApiExtended };

/**
 * Reset posts APIs with authenticated client
 */
export const resetPostsApi = (client?: any) => {
  const { resetPostsCompositeApi } = require('./postsCompositeApiFactory');
  return resetPostsCompositeApi(client);
};

// Export individual operations for direct usage - use composite API
const { 
  getAll: getAllPosts,
  getById: getPostById,
  create: createPost,
  update: updatePost,
  delete: deletePost
} = postsCompositeApi;

const {
  getAll: getAllPostsWithTags,
  getById: getPostWithTagsById
} = postsCompositeApi.view;

const {
  getAll: getAllPostComments,
  getById: getPostCommentById,
  create: createPostComment,
  update: updatePostComment,
  delete: deletePostComment
} = postsCompositeApi.comments;

const {
  getAll: getAllPostLikes,
  getById: getPostLikeById,
  create: createPostLike,
  delete: deletePostLike
} = postsCompositeApi.likes;

const {
  getAll: getAllCommentLikes,
  getById: getCommentLikeById,
  create: createCommentLike,
  delete: deleteCommentLike
} = postsCompositeApi.commentLikes;

export {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getAllPostsWithTags,
  getPostWithTagsById,
  getAllPostComments,
  getPostCommentById,
  createPostComment,
  updatePostComment,
  deletePostComment,
  getAllPostLikes,
  getPostLikeById,
  createPostLike,
  deletePostLike,
  getAllCommentLikes,
  getCommentLikeById,
  createCommentLike,
  deleteCommentLike
};
