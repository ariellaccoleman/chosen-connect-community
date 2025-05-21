
import { ApiResponse, createApiFactory } from "@/api/core";
import { supabase } from "@/integrations/supabase/client";
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
      *,
      profiles!author_id(id, first_name, last_name, avatar_url)
    `;

    // Use the Supabase client directly
    const { data, error } = await supabase
      .from('posts')
      .select(query)
      .order('created_at', { ascending: false });
    
    if (error) {
      return { data: null, error, status: 'error' };
    }
    
    // Transform posts to include author details and proper typing
    const postsWithAuthor = data.map(post => {
      const authorProfile = post.profiles || {};
      const transformedPost: PostWithAuthor = {
        id: post.id,
        author_id: post.author_id,
        content: post.content,
        has_media: post.has_media,
        created_at: post.created_at,
        updated_at: post.updated_at,
        author: authorProfile as PostWithAuthor['author']
      };
      
      return transformedPost;
    });
    
    return { data: postsWithAuthor, error: null, status: 'success' };
  };

  /**
   * Get a single post with author details and media
   */
  const getPostById = async (id: string): Promise<ApiResponse<PostWithAuthor>> => {
    const query = `
      *,
      profiles!author_id(id, first_name, last_name, avatar_url),
      post_media(*)
    `;

    // Use the Supabase client directly
    const { data, error } = await supabase
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
    const authorProfile = data.profiles || {};
    const media = data.post_media || [];
    
    const postWithAuthor: PostWithAuthor = {
      id: data.id,
      author_id: data.author_id,
      content: data.content,
      has_media: data.has_media,
      created_at: data.created_at,
      updated_at: data.updated_at,
      author: authorProfile as PostWithAuthor['author'],
      media: media
    };
    
    return { data: postWithAuthor, error: null, status: 'success' };
  };

  /**
   * Get posts by tag
   */
  const getPostsByTag = async (tagId: string): Promise<ApiResponse<PostWithAuthor[]>> => {
    // Get post IDs first from tag assignments
    const { data: tagAssignments, error: assignmentsError } = await supabase
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
      *,
      profiles!author_id(id, first_name, last_name, avatar_url)
    `;

    const { data, error } = await supabase
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
      
      const transformedPost: PostWithAuthor = {
        id: post.id,
        author_id: post.author_id,
        content: post.content,
        has_media: post.has_media,
        created_at: post.created_at,
        updated_at: post.updated_at,
        author: authorProfile as PostWithAuthor['author']
      };
      
      return transformedPost;
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
