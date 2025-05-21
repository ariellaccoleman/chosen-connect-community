
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePostsByTag } from '@/hooks/posts';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '@/config/routes';
import { Button } from '@/components/ui/button';
import { ChevronRight, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface PostCarouselProps {
  tagId: string | undefined;
}

const PostCarousel = ({ tagId }: PostCarouselProps) => {
  const { data: posts = [], isLoading } = usePostsByTag(tagId);
  
  // Show only the most recent 5 posts
  const recentPosts = posts.slice(0, 5);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex justify-between items-center">
            <span>Recent Posts</span>
            <Skeleton className="h-8 w-24" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {[1, 2, 3].map((_, i) => (
              <PostItemSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (recentPosts.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex justify-between items-center">
            <span>Recent Posts</span>
            <Button variant="ghost" size="sm" asChild>
              <Link to={APP_ROUTES.FEED}>
                View all <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center">
            <p className="text-muted-foreground">No posts yet</p>
            <Button variant="outline" size="sm" asChild className="mt-2">
              <Link to={APP_ROUTES.FEED}>Create a post</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex justify-between items-center">
          <span>Recent Posts</span>
          <Button variant="ghost" size="sm" asChild>
            <Link to={APP_ROUTES.FEED}>
              View all <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {recentPosts.map(post => (
            <PostItem key={post.id} post={post} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const PostItem = ({ post }: { post: any }) => {
  return (
    <Link to={APP_ROUTES.FEED} className="block">
      <div className="p-3 rounded-md border hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={post.author?.avatar_url} />
            <AvatarFallback>
              {post.author?.first_name?.[0] || 'U'}
              {post.author?.last_name?.[0] || ''}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">
              {post.author?.first_name} {post.author?.last_name}
            </p>
            <p className="text-xs text-muted-foreground">
              {post.created_at && 
                formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <p className="line-clamp-2 text-sm mb-2">{post.content}</p>
        
        <div className="flex items-center text-xs text-muted-foreground">
          <MessageSquare className="h-3 w-3 mr-1" />
          <span>Comments</span>
        </div>
      </div>
    </Link>
  );
};

const PostItemSkeleton = () => {
  return (
    <div className="p-3 rounded-md border">
      <div className="flex items-center gap-3 mb-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      
      <Skeleton className="h-10 w-full mb-2" />
      
      <Skeleton className="h-4 w-16" />
    </div>
  );
};

export default PostCarousel;
