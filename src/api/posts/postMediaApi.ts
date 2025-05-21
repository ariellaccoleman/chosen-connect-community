
import { ApiResponse, createApiFactory } from "@/api/core";
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
    const response = await api.repository.select()
      .eq('post_id', postId)
      .execute();
    
    return response;
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
    return await api.delete(mediaId);
  };

  return {
    ...api,
    getMediaByPostId,
    addMediaToPost,
    deleteMedia
  };
}

export const postMediaApi = createPostMediaApi();
