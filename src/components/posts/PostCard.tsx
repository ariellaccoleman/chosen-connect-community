
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PostWithAuthor } from '@/types/post';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, ThumbsUp, Share2, MoreVertical } from 'lucide-react';
import PostComments from './PostComments';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useDeletePost } from '@/hooks/posts';

interface PostCardProps {
  post: PostWithAuthor;
}

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const { mutateAsync: deletePost, isPending: isDeleting } = useDeletePost();
  
  const toggleComments = () => setShowComments(!showComments);
  
  const handleDeletePost = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost(post.id);
      } catch (error) {
        console.error("Failed to delete post:", error);
      }
    }
  };
  
  const isAuthor = user?.id === post.author_id;
  
  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex justify-between">
          <div className="flex gap-3">
            <Avatar>
              <AvatarImage src={post.author?.avatar_url} />
              <AvatarFallback>
                {post.author?.first_name?.[0] || 'U'}
                {post.author?.last_name?.[0] || ''}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">
                {post.author?.first_name} {post.author?.last_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {post.created_at && 
                  formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDeletePost} disabled={isDeleting}>
                  Delete post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <div className="whitespace-pre-wrap">{post.content}</div>
        
        {/* Placeholder for post media - will be implemented in future */}
        {post.has_media && post.media && post.media.length > 0 && (
          <div className="mt-4 p-4 border rounded-md text-center">
            <p className="text-muted-foreground">Media display coming soon</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex flex-col gap-4">
        <div className="flex gap-4">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <ThumbsUp className="h-4 w-4 mr-1" />
            Like
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={toggleComments}>
            <MessageSquare className="h-4 w-4 mr-1" />
            Comment
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
        
        {showComments && <PostComments postId={post.id} />}
      </CardFooter>
    </Card>
  );
};

export default PostCard;
