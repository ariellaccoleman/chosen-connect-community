
import { ApiResponse, createApiFactory } from "@/api/core";
import { Post, PostWithAuthor, CreatePostPayload } from "@/types/post";

/**
 * Creates post API operations
 */
export function createPostApi() {
  const api = createApiFactory<Post>({
    tableName: 'posts',
    entityName: 'Post',
    useQueryOperations: true,
    useMutationOperations: true,
    useBatchOperations: true,
    repository: {
      type: 'supabase',
      enhanced: true,
      enableLogging: true,
    }
  });

  /**
   * Get posts with author details
   */
  const getPostsWithAuthor = async (): Promise<ApiResponse<PostWithAuthor[]>> => {
    const query = `
      posts(*),
      profiles!author_id(id, first_name, last_name, avatar_url)
    `;

    // Use the provided api client to make the query
    const { data, error, status } = await api.supabase
      .from('posts')
      .select(query)
      .order('created_at', { ascending: false });
    
    if (error) {
      return { data: null, error, status: 'error' };
    }
    
    // Transform posts to include author details and proper typing
    const postsWithAuthor = data.map(post => {
      const authorProfile = post.profiles || {};
      return {
        ...post,
        author: authorProfile as PostWithAuthor['author']
      } as PostWithAuthor;
    });
    
    return { data: postsWithAuthor, error: null, status: 'success' };
  };

  /**
   * Get a single post with author details and media
   */
  const getPostById = async (id: string): Promise<ApiResponse<PostWithAuthor>> => {
    const query = `
      posts(*),
      profiles!author_id(id, first_name, last_name, avatar_url),
      post_media(*)
    `;

    // Use the provided api client to make the query
    const { data, error } = await api.supabase
      .from('posts')
      .select(query)
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      return { data: null, error, status: 'error' };
    }
    
    if (!data) {
      return { 
        data: null, 
        error: { code: 'not_found', message: 'Post not found' }, 
        status: 'error' 
      };
    }

    // Transform post to include author details, media, and proper typing
    const post = data;
    const authorProfile = post.profiles || {};
    const media = post.post_media || [];
    
    const postWithAuthor: PostWithAuthor = {
      ...post,
      author: authorProfile as PostWithAuthor['author'],
      media: media as PostWithAuthor['media'],
    };
    
    return { data: postWithAuthor, error: null, status: 'success' };
  };

  /**
   * Get posts by tag
   */
  const getPostsByTag = async (tagId: string): Promise<ApiResponse<PostWithAuthor[]>> => {
    // Get post IDs first from tag assignments
    const { data: tagAssignments, error: assignmentsError } = await api.supabase
      .from('tag_assignments')
      .select('target_id')
      .eq('tag_id', tagId)
      .eq('target_type', 'post');
    
    if (assignmentsError) {
      return { data: null, error: assignmentsError, status: 'error' };
    }
    
    // If no posts with this tag, return an empty array
    if (!tagAssignments || tagAssignments.length === 0) {
      return { data: [], error: null, status: 'success' };
    }
    
    // Extract post IDs from the assignments
    const postIds = tagAssignments.map(
      assignment => assignment.target_id
    );
    
    // Now get the posts with these IDs, including author details
    const query = `
      posts(*),
      profiles!author_id(id, first_name, last_name, avatar_url)
    `;

    const { data, error } = await api.supabase
      .from('posts')
      .select(query)
      .in('id', postIds)
      .order('created_at', { ascending: false });
    
    if (error) {
      return { data: null, error, status: 'error' };
    }
    
    // Transform posts to include author details
    const postsWithAuthor = data.map(post => {
      const authorProfile = post.profiles || {};
      return {
        ...post,
        author: authorProfile as PostWithAuthor['author']
      } as PostWithAuthor;
    });
    
    return { data: postsWithAuthor, error: null, status: 'success' };
  };

  return {
    ...api,
    getPostsWithAuthor,
    getPostById,
    getPostsByTag
  };
}

export const postApi = createPostApi();
