
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { postsWithTagsApi } from "@/api/posts/postsApiFactory";
import PostCard from "./PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";

interface PostCarouselProps {
  hubTagId?: string;
  limit?: number;
  className?: string;
}

const PostCarousel = ({ hubTagId, limit = 10, className = "" }: PostCarouselProps) => {
  const { data: posts = [], isLoading, error } = useQuery({
    queryKey: ['posts-carousel', hubTagId, limit],
    queryFn: async () => {
      try {
        logger.debug(`PostCarousel: Fetching posts`, { hubTagId, limit });
        
        let apiResponse;
        
        if (hubTagId) {
          // Use server-side tag filtering
          apiResponse = await postsWithTagsApi.filterByTagNames([hubTagId]);
        } else {
          // Get all posts
          apiResponse = await postsWithTagsApi.getAll();
        }
        
        if (apiResponse.isSuccess()) {
          const postsData = apiResponse.data || [];
          logger.debug(`PostCarousel: Found ${postsData.length} posts`);
          
          // Apply limit and return
          return postsData.slice(0, limit);
        } else {
          logger.error('PostCarousel: Failed to fetch posts:', apiResponse.error);
          return [];
        }
      } catch (error) {
        logger.error('PostCarousel: Error fetching posts:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    logger.error('PostCarousel: Query error:', error);
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Failed to load posts</p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">
          {hubTagId ? 'No posts found for this topic' : 'No posts available'}
        </p>
      </div>
    );
  }

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default PostCarousel;
