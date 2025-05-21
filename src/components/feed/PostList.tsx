
import React, { useEffect } from "react";
import PostCard from "./PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { usePosts } from "@/hooks/posts";
import { logger } from "@/utils/logger";
import { fixTagEntityAssociations } from "@/utils/tags/fixTagEntityTypes";
import { EntityType } from "@/types/entityTypes";
import { toast } from "sonner";

interface PostListProps {
  selectedTagId: string | null;
}

const PostList: React.FC<PostListProps> = ({ selectedTagId }) => {
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
  
  // Filter posts by selected tag if a tag is selected
  const filteredPosts = selectedTagId
    ? posts.filter(post => {
        const hasTags = Array.isArray(post.tags) && post.tags.length > 0;
        if (!hasTags) return false;
        
        return post.tags.some(tag => tag.id === selectedTagId);
      })
    : posts;

  logger.debug("Selected tag ID:", selectedTagId);
  logger.debug("Filtered posts:", filteredPosts.length);
  logger.debug("Posts with tags:", posts.map(p => ({ 
    id: p.id,
    content: p.content?.substring(0, 20) + "...",
    tags: p.tags 
  })));

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
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">
          {selectedTagId ? "No posts match the selected tag." : "No posts yet. Be the first to post!"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredPosts.map(post => (
        <PostCard key={post.id} post={post} isCompact={false} />
      ))}
    </div>
  );
};

export default PostList;
