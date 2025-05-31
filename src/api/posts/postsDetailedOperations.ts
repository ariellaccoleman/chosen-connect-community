
import { apiClient } from '../core/apiClient';
import { createSuccessResponse, createErrorResponse, ApiResponse } from '../core/errorHandler';
import { PostWithDetails } from '@/types/post';
import { logger } from '@/utils/logger';

/**
 * Get posts with full details including author, likes, and comments
 */
export const getPostsWithDetails = async (
  limit = 10,
  offset = 0,
  client?: any
): Promise<ApiResponse<PostWithDetails[]>> => {
  return apiClient.query(async (supabase) => {
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(
            id, first_name, last_name, avatar_url
          ),
          post_likes(id, user_id),
          post_comments(
            id, content, author_id, created_at,
            author:profiles!post_comments_author_id_fkey(
              id, first_name, last_name, avatar_url
            ),
            comment_likes(id, user_id)
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Error fetching posts with details:', error);
        return createErrorResponse(error);
      }

      const transformedPosts: PostWithDetails[] = (posts || []).map((post: any) => ({
        id: post.id,
        content: post.content,
        author_id: post.author_id,
        has_media: post.has_media || false,
        created_at: post.created_at,
        updated_at: post.updated_at,
        author: post.author,
        likes: post.post_likes || [],
        comments: (post.post_comments || []).map((comment: any) => ({
          ...comment,
          likes: comment.comment_likes || []
        }))
      }));

      return createSuccessResponse(transformedPosts);
    } catch (error) {
      logger.error('Exception in getPostsWithDetails:', error);
      return createErrorResponse(error);
    }
  }, client);
};

/**
 * Get a single post with full details
 */
export const getPostWithDetails = async (
  postId: string,
  client?: any
): Promise<ApiResponse<PostWithDetails>> => {
  return apiClient.query(async (supabase) => {
    try {
      const { data: post, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(
            id, first_name, last_name, avatar_url
          ),
          post_likes(id, user_id),
          post_comments(
            id, content, author_id, created_at,
            author:profiles!post_comments_author_id_fkey(
              id, first_name, last_name, avatar_url
            ),
            comment_likes(id, user_id)
          )
        `)
        .eq('id', postId)
        .single();

      if (error) {
        logger.error('Error fetching post with details:', error);
        return createErrorResponse(error);
      }

      const transformedPost: PostWithDetails = {
        id: post.id,
        content: post.content,
        author_id: post.author_id,
        has_media: post.has_media || false,
        created_at: post.created_at,
        updated_at: post.updated_at,
        author: post.author,
        likes: post.post_likes || [],
        comments: (post.post_comments || []).map((comment: any) => ({
          ...comment,
          likes: comment.comment_likes || []
        }))
      };

      return createSuccessResponse(transformedPost);
    } catch (error) {
      logger.error('Exception in getPostWithDetails:', error);
      return createErrorResponse(error);
    }
  }, client);
};
