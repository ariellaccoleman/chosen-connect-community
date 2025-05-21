
import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Share2, MoreHorizontal } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Author {
  id: string;
  name: string;
  avatar?: string;
  title?: string;
}

interface Post {
  id: string;
  author: Author;
  content: string;
  timestamp: Date;
  image?: string;
  likes: number;
  comments: number;
}

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Post header */}
        <div className="p-4 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.avatar} alt={post.author.name} />
              <AvatarFallback className="bg-chosen-blue text-white">
                {post.author.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-sm">{post.author.name}</h3>
              <p className="text-xs text-gray-500">{post.author.title}</p>
              <p className="text-xs text-gray-400">
                {formatDistanceToNow(post.timestamp)} ago
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Post content */}
        <div className="px-4 pb-3">
          <p className="text-sm">{post.content}</p>
        </div>
        
        {/* Post image (if available) */}
        {post.image && (
          <div className="w-full">
            <img 
              src={post.image} 
              alt="Post attachment" 
              className="w-full object-cover max-h-96"
            />
          </div>
        )}
        
        {/* Post stats */}
        <div className="px-4 py-2 flex justify-between items-center text-xs text-gray-500">
          <span>{post.likes} likes</span>
          <span>{post.comments} comments</span>
        </div>
        
        <Separator />
        
        {/* Action buttons */}
        <CardFooter className="px-2 py-1 flex justify-between">
          <Button variant="ghost" size="sm" className="flex-1 text-gray-600">
            <Heart className="h-4 w-4 mr-2" />
            Like
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 text-gray-600">
            <MessageSquare className="h-4 w-4 mr-2" />
            Comment
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 text-gray-600">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </CardFooter>
      </CardContent>
    </Card>
  );
};

export default PostCard;
