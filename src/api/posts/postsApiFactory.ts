
import { createApiFactory } from "@/api/core/factory";
import { extendApiOperations } from "@/api/core/apiExtension";
import { supabase } from "@/integrations/supabase/client";
import { ApiResponse } from "@/api/core/types";
import { Post, PostComment, PostLike, CommentLike, CreatePostRequest, CreateCommentRequest } from "@/types/post";
import { createErrorResponse, createSuccessResponse } from "@/api/core/errorHandler";
import { EntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";

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

// Define custom operations interfaces for type safety
interface PostsCustomOperations {
  getPostsWithDetails(): Promise<ApiResponse<Post[]>>;
  createPostWithTags(data: CreatePostRequest): Promise<ApiResponse<Post>>;
  getPostWithDetails(id: string): Promise<ApiResponse<Post>>;
}

interface CommentsCustomOperations {
  getCommentsForPost(postId: string): Promise<ApiResponse<PostComment[]>>;
  createComment(data: CreateCommentRequest): Promise<ApiResponse<PostComment>>;
}

interface PostLikesCustomOperations {
  toggleLike(postId: string): Promise<ApiResponse<boolean>>;
  hasLiked(postId: string): Promise<ApiResponse<boolean>>;
}

interface CommentLikesCustomOperations {
  toggleLike(commentId: string): Promise<ApiResponse<boolean>>;
  hasLiked(commentId: string): Promise<ApiResponse<boolean>>;
}

// Helper function to format author data safely
function formatAuthor(authorData: any) {
  // Ensure authorData is an object
  const author = authorData || {};
  return {
    id: author.id || '',
    name: `${author.first_name || ''} ${author.last_name || ''}`.trim() || 'Unknown User',
    avatar: author.avatar_url || undefined
  };
}

// Extend posts API with custom operations
export const postsApi = extendApiOperations<Post, string, Partial<Post>, Partial<Post>, PostsCustomOperations>(
  postsBaseApi,
  {
    // Get posts with author details, likes count, comments count and tags
    async getPostsWithDetails(): Promise<ApiResponse<Post[]>> {
      try {
        console.log("Fetching posts with details...");
        
        // First, get all posts with author details and counts
        const { data, error } = await supabase
          .from("posts")
          .select(`
            *,
            author:profiles!posts_author_id_fkey(id, first_name, last_name, avatar_url),
            post_likes(count),
            post_comments(count)
          `)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching posts:", error);
          throw error;
        }
        
        console.log("Raw posts data:", data);
        
        if (!data || data.length === 0) {
          return createSuccessResponse([]);
        }

        // Now, get tag assignments for these posts in a separate query
        const postIds = data.map(post => post.id);
        const { data: tagAssignments, error: tagError } = await supabase
          .from("tag_assignments")
          .select(`
            tag_id,
            target_id,
            tags:tag_id(id, name)
          `)
          .in('target_id', postIds)
          .eq('target_type', 'post');
          
        if (tagError) {
          console.error("Error fetching tag assignments:", tagError);
          // Don't throw here, just continue without tags
        }
        
        console.log("Tag assignments:", tagAssignments);
        
        // Group tag assignments by post ID
        const tagsByPostId = (tagAssignments || []).reduce((acc: Record<string, any[]>, curr: any) => {
          if (!acc[curr.target_id]) {
            acc[curr.target_id] = [];
          }
          if (curr.tags) {
            acc[curr.target_id].push(curr.tags);
          }
          return acc;
        }, {});
        
        const formattedPosts = data.map(post => {
          // Format the author data using our helper function
          const author = formatAuthor(post.author);

          // Fix: Properly count likes and comments
          // The post_likes and post_comments arrays contain objects with count property
          // We need to extract the actual count value or default to 0
          const likesCount = post.post_likes && post.post_likes.length > 0 
            ? (post.post_likes[0].count || 0) 
            : 0;
            
          const commentsCount = post.post_comments && post.post_comments.length > 0 
            ? (post.post_comments[0].count || 0) 
            : 0;

          return {
            ...post,
            author,
            likes_count: likesCount,
            comments_count: commentsCount,
            tags: tagsByPostId[post.id] || []
          };
        });
        
        console.log("Formatted posts:", formattedPosts);
        
        return createSuccessResponse(formattedPosts || []);
      } catch (error) {
        console.error("Error in getPostsWithDetails:", error);
        return createErrorResponse(error);
      }
    },

    // Create post with tags
    async createPostWithTags(data: CreatePostRequest): Promise<ApiResponse<Post>> {
      try {
        logger.info("Creating post with tags:", data);
        
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

        if (error) {
          logger.error("Error creating post:", error);
          throw error;
        }

        // Assign tags if provided
        if (data.tag_ids && data.tag_ids.length > 0 && post) {
          logger.info("Creating tag assignments for post", { 
            postId: post.id,
            tagIds: data.tag_ids
          });
          
          // Create tag assignments
          const tagAssignments = data.tag_ids.map(tagId => ({
            target_id: post.id,
            tag_id: tagId,
            target_type: EntityType.POST
          }));

          const { error: tagError } = await supabase
            .from("tag_assignments")
            .insert(tagAssignments);

          if (tagError) {
            logger.error("Error creating tag assignments:", tagError);
            throw tagError;
          }
          
          // For each tag, ensure it's associated with the POST entity type
          for (const tagId of data.tag_ids) {
            await ensureTagEntityType(tagId, EntityType.POST);
          }
        }

        return createSuccessResponse(post);
      } catch (error) {
        logger.error("Error in createPostWithTags:", error);
        return createErrorResponse(error);
      }
    },

    // Get post by ID with details
    async getPostWithDetails(id: string): Promise<ApiResponse<Post>> {
      try {
        // First, get the post with author details and counts
        const { data, error } = await supabase
          .from("posts")
          .select(`
            *,
            author:profiles!posts_author_id_fkey(id, first_name, last_name, avatar_url),
            post_likes(count),
            post_comments(count)
          `)
          .eq("id", id)
          .single();

        if (error) throw error;
        
        // Then get tags in a separate query
        const { data: tagAssignments, error: tagError } = await supabase
          .from("tag_assignments")
          .select(`
            tag_id,
            tags:tag_id(id, name)
          `)
          .eq('target_id', id)
          .eq('target_type', 'post');
          
        if (tagError) {
          console.error("Error fetching tags for post:", tagError);
          // Don't throw here, just continue without tags
        }

        // Format the author data with our helper function
        const author = formatAuthor(data.author);
        
        // Extract tags from assignments
        const tags = (tagAssignments || [])
          .map((assignment: any) => assignment.tags)
          .filter(Boolean);

        // Fix: Properly count likes and comments
        const likesCount = data.post_likes && data.post_likes.length > 0 
          ? (data.post_likes[0].count || 0) 
          : 0;
          
        const commentsCount = data.post_comments && data.post_comments.length > 0 
          ? (data.post_comments[0].count || 0) 
          : 0;

        const formattedPost = {
          ...data,
          author,
          likes_count: likesCount,
          comments_count: commentsCount,
          tags: tags || []
        };

        return createSuccessResponse(formattedPost);
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  }
);

// Helper function to ensure a tag is associated with an entity type
async function ensureTagEntityType(tagId: string, entityType: EntityType): Promise<void> {
  try {
    logger.info(`Ensuring tag ${tagId} is associated with entity type ${entityType}`);
    
    // Check if the entity type association already exists
    const { data, error } = await supabase
      .from("tag_entity_types")
      .select()
      .eq("tag_id", tagId)
      .eq("entity_type", entityType)
      .maybeSingle();
      
    if (error) {
      logger.error("Error checking tag entity type:", error);
      return;
    }
    
    // If association doesn't exist, create it
    if (!data) {
      logger.info(`Creating new association for tag ${tagId} with entity type ${entityType}`);
      
      const { error: insertError } = await supabase
        .from("tag_entity_types")
        .insert({
          tag_id: tagId,
          entity_type: entityType
        });
        
      if (insertError) {
        logger.error("Error creating tag entity type:", insertError);
      }
    } else {
      logger.info(`Association for tag ${tagId} with entity type ${entityType} already exists`);
    }
  } catch (error) {
    logger.error("Error in ensureTagEntityType:", error);
  }
}

// Extend comments API with custom operations
export const commentsApi = extendApiOperations<PostComment, string, Partial<PostComment>, Partial<PostComment>, CommentsCustomOperations>(
  commentsBaseApi,
  {
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
          // Format the author data with our helper function
          const author = formatAuthor(comment.author);

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

        // Format the comment with our helper function
        const author = formatAuthor(comment.author);
        
        const formattedComment = {
          ...comment,
          author,
          likes: 0,
          timestamp: new Date(comment.created_at)
        };

        return createSuccessResponse(formattedComment);
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  }
);

// Extend post likes API with custom operations
export const postLikesApi = extendApiOperations<PostLike, string, Partial<PostLike>, Partial<PostLike>, PostLikesCustomOperations>(
  postLikesBaseApi,
  {
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
  }
);

// Extend comment likes API with custom operations
export const commentLikesApi = extendApiOperations<CommentLike, string, Partial<CommentLike>, Partial<CommentLike>, CommentLikesCustomOperations>(
  commentLikesBaseApi,
  {
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
  }
);

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
