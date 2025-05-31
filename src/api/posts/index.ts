
/**
 * Posts API Module
 * 
 * This module exports all the API operations for posts, comments, and likes.
 * Use postsCompositeApi as the primary interface for all post operations.
 */

// Primary composite API interface
export { postsCompositeApi } from './postsCompositeApiFactory';

// Individual API components (for advanced usage)
export { postsTableApi as postsApi } from './postsTableApiFactory';
export { postsViewApi as postsWithTagsApi } from './postsViewApiFactory';
export { postCommentsApi, postLikesApi, commentLikesApi } from './postInteractionApiFactory';

// Extended operations
export { getPostsWithDetails, getPostWithDetails } from './postsDetailedOperations';

// Reset function for testing
export { resetPostsApi } from './postsApiFactory';

// Backwards compatibility exports
export * from './postsApiFactory';
