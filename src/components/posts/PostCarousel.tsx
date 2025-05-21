
import React from 'react';
import { usePostsByTag } from '@/hooks/posts';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { APP_ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface PostCarouselProps {
  tagId?: string;
  limit?: number;
}

const PostCarousel = ({ tagId, limit = 5 }: PostCarouselProps) => {
  const { data: posts = [], isLoading } = usePostsByTag(tagId);
  const { user } = useAuth();
  
  // Filter and limit posts
  const displayPosts = posts.slice(0, limit);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Recent Posts</span>
            <Skeleton className="h-5 w-20" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  // If no posts, show a message
  if (displayPosts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Recent Posts</span>
            <Link 
              to={APP_ROUTES.FEED} 
              className="text-sm font-normal text-primary hover:underline"
            >
              View all
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No posts available</p>
          {user && (
            <p className="mt-2">
              <Link to={APP_ROUTES.FEED} className="text-primary hover:underline">
                Create a post
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>Recent Posts</span>
          <Link 
            to={APP_ROUTES.FEED} 
            className="text-sm font-normal text-primary hover:underline"
          >
            View all
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Carousel className="w-full">
          <CarouselContent>
            {displayPosts.map((post) => (
              <CarouselItem key={post.id}>
                <Link to={APP_ROUTES.FEED}>
                  <div className="p-3 border rounded-md hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={post.author?.avatar_url} alt={post.author?.first_name} />
                        <AvatarFallback>
                          {post.author?.first_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {post.author?.first_name} {post.author?.last_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {post.created_at && formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <p className="line-clamp-2 text-sm">{post.content}</p>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </CardContent>
    </Card>
  );
};

export default PostCarousel;
