
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
    // Get the raw data from the entity
    const rawData = (entity as any).rawData || entity;
    
    return {
      id: entity.id,
      content: entity.description || rawData.content || '',
      author_id: rawData.author_id || '',
      has_media: rawData.has_media || false,
      created_at: entity.created_at || rawData.created_at || '',
      updated_at: entity.updated_at || rawData.updated_at || '',
      author: rawData.author || {
        id: rawData.author_id || '',
        name: rawData.author?.name || 'Unknown',
        avatar: rawData.author?.avatar_url,
        title: rawData.author?.headline
      },
      likes_count: rawData.likes_count || 0,
      comments_count: rawData.comments_count || 0,
      tags: entity.tags ? entity.tags.map(tagAssignment => tagAssignment.tag).filter(Boolean) : []
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
