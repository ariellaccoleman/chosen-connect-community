
import { postsTableApi, resetPostsTableApi } from './postsTableApiFactory';
import { postsViewApi, resetPostsViewApi } from './postsViewApiFactory';
import { postCommentsApi, postLikesApi, commentLikesApi, resetPostInteractionApis } from './postInteractionApiFactory';
import { getPostsWithDetails, getPostWithDetails } from './postsDetailedOperations';

/**
 * Composite Posts API that combines table, view, and interaction operations
 * This is the primary interface that consumers should use
 */
export const postsCompositeApi = {
  // Core table operations
  ...postsTableApi,
  
  // View operations for filtering and display
  view: postsViewApi,
  
  // Interaction APIs
  comments: postCommentsApi,
  likes: postLikesApi,
  commentLikes: commentLikesApi,
  
  // Extended operations
  getPostsWithDetails,
  getPostWithDetails,
  
  // Aliases for backwards compatibility
  getAll: postsTableApi.getAll,
  getById: postsTableApi.getById,
  create: postsTableApi.create,
  update: postsTableApi.update,
  delete: postsTableApi.delete,
  
  // View operations aliases
  getAllWithTags: postsViewApi.getAll,
  getByIdWithTags: postsViewApi.getById,
  filterByTagIds: postsViewApi.filterByTagIds,
  filterByTagNames: postsViewApi.filterByTagNames,
  search: postsViewApi.search
};

/**
 * Reset posts composite API with authenticated client
 */
export const resetPostsCompositeApi = (client?: any) => {
  const tableApi = resetPostsTableApi(client);
  const viewApi = resetPostsViewApi(client);
  const interactionApis = resetPostInteractionApis(client);
  
  return {
    // Core table operations
    ...tableApi,
    
    // View operations for filtering and display
    view: viewApi,
    
    // Interaction APIs
    comments: interactionApis.postCommentsApi,
    likes: interactionApis.postLikesApi,
    commentLikes: interactionApis.commentLikesApi,
    
    // Extended operations
    getPostsWithDetails: (limit?: number, offset?: number) => 
      getPostsWithDetails(limit, offset, client),
    getPostWithDetails: (postId: string) => 
      getPostWithDetails(postId, client),
    
    // Aliases for backwards compatibility
    getAll: tableApi.getAll,
    getById: tableApi.getById,
    create: tableApi.create,
    update: tableApi.update,
    delete: tableApi.delete,
    
    // View operations aliases
    getAllWithTags: viewApi.getAll,
    getByIdWithTags: viewApi.getById,
    filterByTagIds: viewApi.filterByTagIds,
    filterByTagNames: viewApi.filterByTagNames,
    search: viewApi.search
  };
};
