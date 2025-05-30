
import React, { useEffect } from "react";
import PostCard from "./PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { usePosts } from "@/hooks/posts";
import { logger } from "@/utils/logger";
import { fixTagEntityAssociations } from "@/api/tags/tagEntityTypeFixes";
import { EntityType } from "@/types/entityTypes";
import { toast } from "sonner";

interface PostListProps {
  selectedTagId: string | null;
  searchQuery?: string;
}

const PostList: React.FC<PostListProps> = ({ selectedTagId, searchQuery = "" }) => {
  // Use our posts hook to fetch real data
  const { data: postsResponse, isLoading, error, refetch } = usePosts();
  
  // Fix tag entity associations on component mount
  useEffect(() => {
    const fixTags = async () => {
      try {
        logger.info("Fixing tag entity associations for POST entity type");
        // Run the fix function for post entity type
        await fixTagEntityAssociations(EntityType.POST);
        // After fixing, refetch posts to get updated data
        refetch();
      } catch (err) {
        logger.error("Error fixing tag associations:", err);
      }
    };
    
    fixTags();
  }, [refetch]);
  
  // Add console logs to debug the data we're receiving
  logger.debug("Posts response:", postsResponse);
  
  // Extract posts from response and handle error state
  const posts = postsResponse?.data || [];
  
  // Filter posts by selected tag and search query
  const filteredPosts = posts.filter(post => {
    // Filter by tag if a tag is selected
    if (selectedTagId) {
      const hasTags = Array.isArray(post.tags) && post.tags.length > 0;
      if (!hasTags) return false;
      
      const hasSelectedTag = post.tags.some(tag => tag.id === selectedTagId);
      if (!hasSelectedTag) return false;
    }
    
    // Filter by search query if provided
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      const contentMatch = post.content?.toLowerCase().includes(searchLower);
      const authorMatch = post.author?.first_name?.toLowerCase().includes(searchLower) ||
                         post.author?.last_name?.toLowerCase().includes(searchLower);
      
      return contentMatch || authorMatch;
    }
    
    return true;
  });

  logger.debug("Filtering results:", {
    selectedTagId,
    searchQuery,
    totalPosts: posts.length,
    filteredPosts: filteredPosts.length
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-64 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-red-500">Error loading posts: {error.message || "Unknown error"}</p>
      </div>
    );
  }

  if (filteredPosts.length === 0) {
    const hasFilters = selectedTagId || searchQuery.trim();
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">
          {hasFilters ? "No posts match your current filters." : "No posts yet. Be the first to post!"}
        </p>
        {hasFilters && (
          <p className="text-sm text-gray-400 mt-2">
            Try adjusting your search or tag filter to see more results.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredPosts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default PostList;
