
import { createApiFactory } from "@/api/core/factory";
import { extendApiOperations } from "@/api/core/apiExtension";
import { supabase } from "@/integrations/supabase/client";
import { ApiResponse } from "@/api/core/types";
import { Post, PostComment, PostLike, CommentLike, CreatePostRequest, CreateCommentRequest } from "@/types/post";
import { createErrorResponse, createSuccessResponse } from "@/api/core/errorHandler";

// Create base operations for posts
const postsBaseApi = createApiFactory<Post>({
  tableName: "posts",
  entityName: "Post",
  useQueryOperations: true,
  useMutationOperations: true,
  repository: { type: "supabase" }
});

// Create base operations for comments
const commentsBaseApi = createApiFactory<PostComment>({
  tableName: "post_comments",
  entityName: "Comment",
  useQueryOperations: true,
  useMutationOperations: true,
  repository: { type: "supabase" }
});

// Create base operations for post likes
const postLikesBaseApi = createApiFactory<PostLike>({
  tableName: "post_likes",
  entityName: "PostLike",
  useQueryOperations: true,
  useMutationOperations: true,
  repository: { type: "supabase" }
});

// Create base operations for comment likes
const commentLikesBaseApi = createApiFactory<CommentLike>({
  tableName: "comment_likes",
  entityName: "CommentLike",
  useQueryOperations: true,
  useMutationOperations: true,
  repository: { type: "supabase" }
});

// Extend posts API with custom operations
export const postsApi = extendApiOperations(postsBaseApi, {
  // Get posts with author details, likes count, comments count and tags
  async getPostsWithDetails(): Promise<ApiResponse<Post[]>> {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          author:profiles!posts_author_id_fkey(id, first_name, last_name, avatar_url),
          post_likes(count),
          post_comments(count),
          tag_assignments(
            tag_id,
            tags:tag_id(id, name)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedPosts = data?.map(post => {
        // Format the author data
        const authorData = post.author ? post.author : {};
        const author = {
          id: authorData.id || '',
          name: `${authorData.first_name || ''} ${authorData.last_name || ''}`.trim(),
          avatar: authorData.avatar_url
        };

        // Format tags
        const tags = post.tag_assignments && Array.isArray(post.tag_assignments) 
          ? post.tag_assignments.map((assignment: any) => assignment.tags) 
          : [];

        return {
          ...post,
          author,
          likes_count: post.post_likes?.length || 0,
          comments_count: post.post_comments?.length || 0,
          tags
        };
      });

      return createSuccessResponse(formattedPosts || []);
    } catch (error) {
      return createErrorResponse(error);
    }
  },

  // Create post with tags
  async createPostWithTags(data: CreatePostRequest): Promise<ApiResponse<Post>> {
    try {
      // Create the post
      const { data: post, error } = await supabase
        .from("posts")
        .insert({
          content: data.content,
          author_id: (await supabase.auth.getUser()).data.user?.id,
          has_media: data.has_media
        })
        .select()
        .single();

      if (error) throw error;

      // Assign tags if provided
      if (data.tag_ids && data.tag_ids.length > 0 && post) {
        const tagAssignments = data.tag_ids.map(tagId => ({
          target_id: post.id,
          tag_id: tagId,
          target_type: 'post'
        }));

        const { error: tagError } = await supabase
          .from("tag_assignments")
          .insert(tagAssignments);

        if (tagError) throw tagError;
      }

      return createSuccessResponse(post);
    } catch (error) {
      return createErrorResponse(error);
    }
  },

  // Get post by ID with details
  async getPostWithDetails(id: string): Promise<ApiResponse<Post>> {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          author:profiles!posts_author_id_fkey(id, first_name, last_name, avatar_url),
          post_likes(count),
          post_comments(count),
          tag_assignments(
            tag_id,
            tags:tag_id(id, name)
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      // Format the author data
      const authorData = data.author ? data.author : {};
      const author = {
        id: authorData.id || '',
        name: `${authorData.first_name || ''} ${authorData.last_name || ''}`.trim(),
        avatar: authorData.avatar_url
      };

      // Format tags
      const tags = data.tag_assignments && Array.isArray(data.tag_assignments)
        ? data.tag_assignments.map((assignment: any) => assignment.tags)
        : [];

      const formattedPost = {
        ...data,
        author,
        likes_count: data.post_likes?.length || 0,
        comments_count: data.post_comments?.length || 0,
        tags
      };

      return createSuccessResponse(formattedPost);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
});

// Extend comments API with custom operations
export const commentsApi = extendApiOperations(commentsBaseApi, {
  // Get comments for a post with author details and likes count
  async getCommentsForPost(postId: string): Promise<ApiResponse<PostComment[]>> {
    try {
      const { data, error } = await supabase
        .from("post_comments")
        .select(`
          *,
          author:profiles!post_comments_author_id_fkey(id, first_name, last_name, avatar_url),
          comment_likes(count)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const formattedComments = data?.map(comment => {
        // Format the author data
        const authorData = comment.author ? comment.author : {};
        const author = {
          id: authorData.id || '',
          name: `${authorData.first_name || ''} ${authorData.last_name || ''}`.trim(),
          avatar: authorData.avatar_url
        };

        return {
          ...comment,
          author,
          likes: comment.comment_likes?.length || 0,
          timestamp: new Date(comment.created_at)
        };
      });

      return createSuccessResponse(formattedComments || []);
    } catch (error) {
      return createErrorResponse(error);
    }
  },

  // Create a comment on a post
  async createComment(data: CreateCommentRequest): Promise<ApiResponse<PostComment>> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      const { data: comment, error } = await supabase
        .from("post_comments")
        .insert({
          post_id: data.post_id,
          content: data.content,
          author_id: userId
        })
        .select(`
          *,
          author:profiles!post_comments_author_id_fkey(id, first_name, last_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Format the comment
      const authorData = comment.author ? comment.author : {};
      const formattedComment = {
        ...comment,
        author: {
          id: authorData.id || '',
          name: `${authorData.first_name || ''} ${authorData.last_name || ''}`.trim(),
          avatar: authorData.avatar_url
        },
        likes: 0,
        timestamp: new Date(comment.created_at)
      };

      return createSuccessResponse(formattedComment);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
});

// Extend post likes API with custom operations
export const postLikesApi = extendApiOperations(postLikesBaseApi, {
  // Toggle like on a post (like if not liked, unlike if already liked)
  async toggleLike(postId: string): Promise<ApiResponse<boolean>> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      // Check if user already liked the post
      const { data: existingLike, error: fetchError } = await supabase
        .from("post_likes")
        .select()
        .eq("post_id", postId)
        .eq("user_id", userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingLike) {
        // Unlike: delete the existing like
        const { error: deleteError } = await supabase
          .from("post_likes")
          .delete()
          .eq("id", existingLike.id);

        if (deleteError) throw deleteError;
        return createSuccessResponse(false); // Unliked
      } else {
        // Like: create a new like
        const { error: insertError } = await supabase
          .from("post_likes")
          .insert({
            post_id: postId,
            user_id: userId
          });

        if (insertError) throw insertError;
        return createSuccessResponse(true); // Liked
      }
    } catch (error) {
      return createErrorResponse(error);
    }
  },

  // Check if user has liked a post
  async hasLiked(postId: string): Promise<ApiResponse<boolean>> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      const { data, error } = await supabase
        .from("post_likes")
        .select()
        .eq("post_id", postId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      
      return createSuccessResponse(!!data);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
});

// Extend comment likes API with custom operations
export const commentLikesApi = extendApiOperations(commentLikesBaseApi, {
  // Toggle like on a comment
  async toggleLike(commentId: string): Promise<ApiResponse<boolean>> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      // Check if user already liked the comment
      const { data: existingLike, error: fetchError } = await supabase
        .from("comment_likes")
        .select()
        .eq("comment_id", commentId)
        .eq("user_id", userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingLike) {
        // Unlike: delete the existing like
        const { error: deleteError } = await supabase
          .from("comment_likes")
          .delete()
          .eq("id", existingLike.id);

        if (deleteError) throw deleteError;
        return createSuccessResponse(false); // Unliked
      } else {
        // Like: create a new like
        const { error: insertError } = await supabase
          .from("comment_likes")
          .insert({
            comment_id: commentId,
            user_id: userId
          });

        if (insertError) throw insertError;
        return createSuccessResponse(true); // Liked
      }
    } catch (error) {
      return createErrorResponse(error);
    }
  },

  // Check if user has liked a comment
  async hasLiked(commentId: string): Promise<ApiResponse<boolean>> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      const { data, error } = await supabase
        .from("comment_likes")
        .select()
        .eq("comment_id", commentId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      
      return createSuccessResponse(!!data);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
});

// Export individual operations for direct usage
export const {
  getAll: getAllPosts,
  getById: getPostById,
  create: createPost,
  update: updatePost,
  delete: deletePost
} = postsApi;

export const {
  getAll: getAllComments,
  getById: getCommentById,
  create: createComment,
  update: updateComment,
  delete: deleteComment
} = commentsApi;
