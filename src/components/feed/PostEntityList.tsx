
import React from "react";
import { Entity } from "@/types/entity";
import PostCard from "./PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Post } from "@/types/post";
import { EntityType } from "@/types/entityTypes";

interface PostEntityListProps {
  entities: Entity[];
  isLoading?: boolean;
  emptyMessage?: string;
}

/**
 * Specialized list component for displaying posts as entities
 * Maintains the same styling as the original PostList
 */
const PostEntityList = ({ 
  entities, 
  isLoading = false, 
  emptyMessage = "No posts found"
}: PostEntityListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-64 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  // Filter to only show post entities
  const postEntities = entities.filter(entity => entity.entityType === EntityType.POST);

  if (postEntities.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  // Convert entities back to Post format for PostCard
  const posts: Post[] = postEntities.map(entity => {
    // The full post data is preserved in rawData
    const postData = (entity as any).rawData;
    
    if (!postData) {
      // Fallback if rawData is not available
      return {
        id: entity.id,
        content: entity.description || '',
        author_id: '',
        has_media: false,
        created_at: entity.created_at || '',
        updated_at: entity.updated_at || '',
        author: {
          id: '',
          name: 'Unknown'
        },
        likes_count: 0,
        comments_count: 0,
        tags: entity.tags ? entity.tags.map(tagAssignment => tagAssignment.tag).filter(Boolean) : []
      };
    }
    
    // Use the full post data structure and preserve the correct structure
    return {
      id: postData.id,
      content: postData.content,
      author_id: postData.author_id,
      has_media: postData.has_media || false,
      created_at: postData.created_at,
      updated_at: postData.updated_at,
      author: postData.author,
      likes_count: postData.likes?.length || 0,
      comments_count: postData.comments?.length || 0,
      // Map the entity tags to the format expected by PostCard, preserving tag objects
      tags: entity.tags ? entity.tags.map(tagAssignment => ({
        id: tagAssignment.tag?.id || '',
        name: tagAssignment.tag?.name || '',
        description: tagAssignment.tag?.description || null,
        created_by: null,
        created_at: '',
        updated_at: ''
      })).filter(tag => tag.name) : []
    };
  });

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default PostEntityList;
