
import React from "react";
import { Post } from "@/types/post";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MessageSquare, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import TagList from "../tags/TagList";

interface PostCardProps {
  post: Post;
  isCompact?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, isCompact = false }) => {
  const { author, content, created_at, likes_count = 0, comments_count = 0, tags = [] } = post;
  
  // Format the date
  const timeAgo = formatDistanceToNow(new Date(created_at), { addSuffix: true });
  
  // Get author initials for avatar fallback
  const authorInitials = author?.name ? 
    author.name.split(' ').map(n => n[0]).join('').toUpperCase() : 
    'U';
    
  // Convert tags to the format expected by TagList
  const formattedTags = Array.isArray(tags) ? tags.map(tag => ({
    id: typeof tag === 'string' ? tag : tag.id,
    tag_id: typeof tag === 'string' ? tag : tag.id,
    target_id: post.id,
    target_type: 'post',
    tag: typeof tag === 'string' ? { id: tag, name: tag } : tag
  })) : [];

  return (
    <Card className="h-full">
      <CardContent className={isCompact ? "p-4" : "p-6"}>
        {/* Author and timestamp */}
        <div className="flex items-center mb-3">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src={author?.avatar} alt={author?.name || "Author"} />
            <AvatarFallback>{authorInitials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">{author?.name || "Unknown"}</div>
            <div className="text-xs text-gray-500">{timeAgo}</div>
          </div>
        </div>
        
        {/* Post content - truncate for compact view */}
        <div className={`mt-2 ${isCompact ? "line-clamp-3" : ""}`}>
          {content}
        </div>
        
        {/* Tags - only show in non-compact mode or if few tags */}
        {formattedTags.length > 0 && (!isCompact || formattedTags.length <= 2) && (
          <div className="mt-4">
            <TagList tagAssignments={formattedTags} size="sm" />
          </div>
        )}
      </CardContent>
      
      <CardFooter className={`${isCompact ? "px-4 pb-4 pt-0" : "px-6 pb-6 pt-0"} flex items-center justify-between border-t`}>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center">
            <Heart size={16} className="mr-1" />
            <span>{likes_count}</span>
          </div>
          <div className="flex items-center">
            <MessageSquare size={16} className="mr-1" />
            <span>{comments_count}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PostCard;
