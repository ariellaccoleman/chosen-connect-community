
import { ApiResponse, createApiFactory } from "@/api/core";
import { supabase } from "@/integrations/supabase/client";
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
      *,
      profiles!author_id(id, first_name, last_name, avatar_url)
    `;

    const { data, error } = await supabase
      .from('post_comments')
      .select(query)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    
    if (error) {
      return { data: null, error, status: 'error' };
    }
    
    // Transform comments to include author details
    const commentsWithAuthor = data.map(comment => {
      const authorProfile = comment.profiles || {};
      const transformedComment: PostComment = {
        id: comment.id,
        post_id: comment.post_id,
        author_id: comment.author_id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        author: authorProfile as PostComment['author']
      };
      
      return transformedComment;
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
    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId);
      
    if (error) {
      return { data: null, error, status: 'error' };
    }
    
    return { data: null, error: null, status: 'success' };
  };

  /**
   * Check if user can delete a comment (if they are post owner or comment author)
   */
  const checkDeletePermission = async (userId: string, commentId: string): Promise<boolean> => {
    if (!userId || !commentId) return false;
    
    try {
      // Get the comment with post author information
      const query = `
        *,
        posts!post_id(author_id)
      `;
      
      const { data, error } = await supabase
        .from('post_comments')
        .select(query)
        .eq('id', commentId)
        .maybeSingle();
      
      if (error || !data) {
        return false;
      }
      
      // User can delete if they are the comment author or the post owner
      return (data.author_id === userId) || 
             (data.posts && data.posts.author_id === userId);
    } catch (error) {
      return false;
    }
  };

  /**
   * Get comment count for a post
   */
  const getCommentCount = async (postId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);
      
      if (error || count === null) {
        return 0;
      }
      
      return count;
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
