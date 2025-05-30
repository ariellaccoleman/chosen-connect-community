
import { EntityType } from "./entityTypes";
import { Tag } from "@/utils/tags/types";

export interface Author {
  id: string;
  name: string;
  avatar?: string;
  title?: string;
}

export interface PostComment {
  id: string;
  author: Author;
  content: string;
  timestamp: Date;
  likes: number;
  post_id: string;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

export interface Post {
  id: string;
  content: string;
  author_id: string;
  has_media: boolean;
  created_at: string;
  updated_at: string;
  
  // Expanded data (not from database)
  author?: Author;
  likes_count?: number;
  comments_count?: number;
  tags?: Tag[];
  comments?: PostComment[];
  has_liked?: boolean;
}

// Add the missing type exports
export interface PostCreate {
  content: string;
  author_id: string;
  has_media: boolean;
}

export interface PostUpdate {
  content?: string;
  has_media?: boolean;
}

export interface PostWithDetails extends Post {
  author: Author;
  likes: PostLike[];
  comments: Array<PostComment & { likes: CommentLike[] }>;
}

export interface CreatePostRequest {
  content: string;
  has_media: boolean;
  tag_ids?: string[];
}

export interface CreateCommentRequest {
  post_id: string;
  content: string;
}
