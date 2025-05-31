
import { createViewApiFactory } from '../core/factory/viewApiFactory';
import { Post } from '@/types/post';

// Create the posts with tags view API for filtering and display
export const postsViewApi = createViewApiFactory<Post & { tags?: any[], tag_names?: string[] }, string>({
  viewName: 'posts_with_tags',
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
  enableLogging: false
});

/**
 * Reset posts view API with authenticated client
 */
export const resetPostsViewApi = (client?: any) => {
  return createViewApiFactory<Post & { tags?: any[], tag_names?: string[] }, string>({
    viewName: 'posts_with_tags',
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
    enableLogging: false
  }, client);
};
