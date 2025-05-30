
/**
 * Posts API Module
 * 
 * This module exports all the API operations for posts, comments, and likes.
 */

export * from './postsApiFactory';

// Explicitly re-export the reset function with its unique name
export { resetPostsApi } from './postsApiFactory';
