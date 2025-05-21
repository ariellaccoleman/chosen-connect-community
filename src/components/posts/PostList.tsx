
import React from 'react';
import { Entity } from '@/types/entityRegistry';
import PostCard from './PostCard';
import { usePost } from '@/hooks/posts';
import { EntityType } from '@/types/entityTypes';
import { Skeleton } from '@/components/ui/skeleton';

interface PostListProps {
  entities: Entity[];
  isLoading: boolean;
  error: Error | null;
}

const PostList = ({ entities, isLoading, error }: PostListProps) => {
  // Filter only post entities
  const postEntities = entities.filter(entity => entity.entityType === EntityType.POST);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((_, index) => (
          <PostCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg text-red-600">
        <p>Error loading posts: {error.message}</p>
      </div>
    );
  }

  if (postEntities.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg text-center">
        <h3 className="font-medium text-lg">No posts yet</h3>
        <p className="text-muted-foreground">Be the first to create a post!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {postEntities.map(entity => (
        <PostContentLoader key={entity.id} postId={entity.id} />
      ))}
    </div>
  );
};

// Helper component to load individual post data
const PostContentLoader = ({ postId }: { postId: string }) => {
  const { data: post, isLoading } = usePost(postId);
  
  if (isLoading) {
    return <PostCardSkeleton />;
  }
  
  if (!post) {
    return null;
  }
  
  return <PostCard post={post} />;
};

// Skeleton loader for posts
const PostCardSkeleton = () => {
  return (
    <div className="p-4 border rounded-md space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
};

export default PostList;
