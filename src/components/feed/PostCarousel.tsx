
import React from "react";
import { usePosts } from "@/hooks/posts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import PostCard from "./PostCard";
import { MessageSquare } from "lucide-react";

interface PostCarouselProps {
  tagId: string | null;
}

const PostCarousel: React.FC<PostCarouselProps> = ({ tagId }) => {
  // Use our posts hook to fetch posts with proper tag filtering
  const { data: postsResponse, isLoading, error } = usePosts({
    // Pass the tagId to the hook for server-side filtering
    tagId,
    limit: 6,
    includeTags: true
  });
  
  // Extract posts from the response
  const posts = postsResponse?.data || [];
    
  // Sort posts by most recent
  const sortedPosts = [...posts].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-red-500">Error loading posts</p>
      </div>
    );
  }

  if (sortedPosts.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">No posts associated with this hub yet</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <MessageSquare className="h-5 w-5 mr-2" />
        <span>Recent Posts</span>
      </h2>
      
      <Carousel className="w-full">
        <CarouselContent className="-ml-4 overflow-visible">
          {sortedPosts.map(post => (
            <CarouselItem key={`post-${post.id}`} className="pl-4 md:basis-2/5 lg:basis-2/7 pr-4">
              <div className="h-full">
                <PostCard post={post} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {sortedPosts.length > 1 && (
          <div className="flex justify-end mt-2">
            <CarouselPrevious className="mr-2 static translate-y-0 left-auto" />
            <CarouselNext className="static translate-y-0 right-auto" />
          </div>
        )}
      </Carousel>
    </div>
  );
};

export default PostCarousel;
