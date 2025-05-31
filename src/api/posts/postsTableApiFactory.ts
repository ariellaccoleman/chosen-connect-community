
import { createApiFactory } from '../core/factory/apiFactory';
import { Post, PostCreate, PostUpdate } from '@/types/post';

// Create the main posts API using the factory
export const postsTableApi = createApiFactory<Post, string, PostCreate, PostUpdate>({
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

/**
 * Reset posts table API with authenticated client
 */
export const resetPostsTableApi = (client?: any) => {
  return createApiFactory<Post, string, PostCreate, PostUpdate>({
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
};
