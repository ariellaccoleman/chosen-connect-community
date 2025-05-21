
import { ApiResponse, createApiFactory } from "@/api/core";
import { PostComment, CreateCommentPayload } from "@/types/post";

/**
 * Creates post comment API operations
 */
export function createPostCommentApi() {
  const api = createApiFactory<PostComment>({
    tableName: 'post_comments',
    entityName: 'PostComment',
    useQueryOperations: true,
    useMutationOperations: true,
    repository: {
      type: 'supabase',
      enhanced: true,
    }
  });

  /**
   * Get comments for a specific post with author details
   */
  const getCommentsByPostId = async (postId: string): Promise<ApiResponse<PostComment[]>> => {
    const query = `
      post_comments(*),
      profiles!author_id(id, first_name, last_name, avatar_url)
    `;

    const response = await api.repository.select(query)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .execute();
    
    if (response.error) {
      return { data: null, error: response.error, status: 'error' };
    }
    
    // Transform comments to include author details
    const commentsWithAuthor = response.data.map(comment => {
      const authorProfile = comment.profiles || {};
      return {
        ...comment,
        author: authorProfile as PostComment['author']
      } as PostComment;
    });
    
    return { data: commentsWithAuthor, error: null, status: 'success' };
  };

  /**
   * Create a new comment
   */
  const createComment = async (payload: CreateCommentPayload): Promise<ApiResponse<PostComment>> => {
    return await api.create(payload);
  };

  /**
   * Delete a comment
   */
  const deleteComment = async (commentId: string): Promise<ApiResponse<null>> => {
    return await api.delete(commentId);
  };

  /**
   * Check if user can delete a comment (if they are post owner or comment author)
   */
  const checkDeletePermission = async (userId: string, commentId: string): Promise<boolean> => {
    if (!userId || !commentId) return false;
    
    try {
      // Get the comment with post author information
      const query = `
        post_comments(*),
        posts!post_id(author_id)
      `;
      
      const response = await api.repository.select(query)
        .eq('id', commentId)
        .maybeSingle();
      
      if (response.error || !response.data) {
        return false;
      }
      
      const comment = response.data;
      const post = comment.posts || {};
      
      // User can delete if they are the comment author or the post owner
      return comment.author_id === userId || post.author_id === userId;
    } catch (error) {
      return false;
    }
  };

  /**
   * Get comment count for a post
   */
  const getCommentCount = async (postId: string): Promise<number> => {
    try {
      const response = await api.repository.select('count')
        .eq('post_id', postId)
        .single();
      
      if (response.error || !response.data) {
        return 0;
      }
      
      return parseInt(response.data.count) || 0;
    } catch (error) {
      return 0;
    }
  };

  return {
    ...api,
    getCommentsByPostId,
    createComment,
    deleteComment,
    checkDeletePermission,
    getCommentCount
  };
}

export const postCommentApi = createPostCommentApi();
