
import React from "react";
import PostCard from "./PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { usePosts } from "@/hooks/posts";

interface PostListProps {
  selectedTagId: string | null;
}

const PostList: React.FC<PostListProps> = ({ selectedTagId }) => {
  // Use our posts hook to fetch real data
  const { data: postsResponse, isLoading, error } = usePosts();
  
  // Extract posts from response and handle error state
  const posts = postsResponse?.data || [];
  
  // Filter posts by selected tag if a tag is selected
  const filteredPosts = selectedTagId
    ? posts.filter(post => post.tags?.some(tag => tag.id === selectedTagId))
    : posts;

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
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default PostList;
