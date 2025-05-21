
import { ApiResponse, createApiFactory } from "@/api/core";
import { supabase } from "@/integrations/supabase/client";
import { PostMedia, CreatePostMediaPayload } from "@/types/post";

/**
 * Creates post media API operations
 */
export function createPostMediaApi() {
  const api = createApiFactory<PostMedia>({
    tableName: 'post_media',
    entityName: 'PostMedia',
    useQueryOperations: true,
    useMutationOperations: true,
    repository: {
      type: 'supabase',
      enhanced: true,
    }
  });

  /**
   * Get media for a specific post
   */
  const getMediaByPostId = async (postId: string): Promise<ApiResponse<PostMedia[]>> => {
    const { data, error } = await supabase
      .from('post_media')
      .select()
      .eq('post_id', postId);
    
    return { data: data || [], error, status: error ? 'error' : 'success' };
  };

  /**
   * Add media to a post
   */
  const addMediaToPost = async (payload: CreatePostMediaPayload): Promise<ApiResponse<PostMedia>> => {
    return await api.create(payload);
  };

  /**
   * Delete media from a post
   */
  const deleteMedia = async (mediaId: string): Promise<ApiResponse<null>> => {
    const { error } = await supabase
      .from('post_media')
      .delete()
      .eq('id', mediaId);
    
    if (error) {
      return { data: null, error, status: 'error' };
    }
    
    return { data: null, error: null, status: 'success' };
  };

  return {
    ...api,
    getMediaByPostId,
    addMediaToPost,
    deleteMedia
  };
}

export const postMediaApi = createPostMediaApi();
