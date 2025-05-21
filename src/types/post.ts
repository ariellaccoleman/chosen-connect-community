
import { TargetType } from './entityTypes';

/**
 * Post Media Type enum
 */
export type PostMediaType = 'image' | 'video' | 'link';

/**
 * Base Post interface
 */
export interface Post {
  id: string;
  author_id: string;
  content: string;
  has_media: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Extended Post interface with author details
 */
export interface PostWithAuthor extends Post {
  author?: {
    id: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  media?: PostMedia[];
  comment_count?: number;
}

/**
 * Post Media interface
 */
export interface PostMedia {
  id: string;
  post_id: string;
  media_type: PostMediaType;
  url: string;
  created_at: string;
  updated_at: string;
}

/**
 * Comment interface
 */
export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

/**
 * Comment creation payload
 */
export interface CreateCommentPayload {
  post_id: string;
  author_id: string;
  content: string;
}

/**
 * Post creation payload
 */
export interface CreatePostPayload {
  author_id: string;
  content: string;
  has_media: boolean;
}

/**
 * Post media creation payload
 */
export interface CreatePostMediaPayload {
  post_id: string;
  media_type: PostMediaType;
  url: string;
}
