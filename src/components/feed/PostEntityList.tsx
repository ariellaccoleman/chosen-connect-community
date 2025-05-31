
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
  const posts: Post[] = postEntities.map(entity => ({
    id: entity.id,
    content: entity.description || '',
    author_id: (entity as any).author_id || '',
    has_media: (entity as any).has_media || false,
    created_at: entity.created_at || '',
    updated_at: entity.updated_at || '',
    author: (entity as any).author,
    likes_count: (entity as any).likes_count,
    comments_count: (entity as any).comments_count,
    tags: entity.tags || [] // Use the simplified Tag[] format directly
  }));

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default PostEntityList;
