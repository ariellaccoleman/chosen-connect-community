
import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Share2, MoreHorizontal, Send } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface Tag {
  id: string;
  name: string;
  color?: string;
}

interface Author {
  id: string;
  name: string;
  avatar?: string;
  title?: string;
}

interface Comment {
  id: string;
  author: Author;
  content: string;
  timestamp: Date;
  likes: number;
}

interface Post {
  id: string;
  author: Author;
  content: string;
  timestamp: Date;
  image?: string;
  likes: number;
  comments: number;
  tags?: Tag[];
  commentsList?: Comment[];
}

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  
  // Mock comments data if not provided
  const commentsData = post.commentsList || [
    {
      id: `comment-1-${post.id}`,
      author: {
        id: "user4",
        name: "Emma Thompson",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        title: "UX Designer"
      },
      content: "Great insight! Thanks for sharing this.",
      timestamp: new Date(Date.now() - 3600000),
      likes: 3
    },
    {
      id: `comment-2-${post.id}`,
      author: {
        id: "user5",
        name: "Michael Chen",
        avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        title: "Product Manager"
      },
      content: "I've been thinking about this recently. Would love to discuss further.",
      timestamp: new Date(Date.now() - 7200000),
      likes: 1
    }
  ];
  
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting comment:", commentText);
    // In a real app, you would add the comment to the database here
    setCommentText("");
  };
  
  const toggleComments = () => {
    setShowComments(!showComments);
  };
  
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
        
        {/* Post tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <Badge key={tag.id} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
        
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
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 text-gray-600"
            onClick={toggleComments}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Comment
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 text-gray-600">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </CardFooter>
        
        {/* Comments section */}
        {showComments && (
          <div className="px-4 py-3 bg-gray-50">
            {/* Comment form */}
            <form onSubmit={handleCommentSubmit} className="flex items-start space-x-2 mb-4">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback className="bg-chosen-blue text-white">
                  U
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Write a comment..."
                  className="min-h-[60px] text-sm resize-none mb-2"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    size="sm"
                    className="bg-chosen-blue hover:bg-chosen-navy"
                    disabled={!commentText.trim()}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Post
                  </Button>
                </div>
              </div>
            </form>
            
            {/* Comment list */}
            {commentsData.length > 0 ? (
              <div className="space-y-4">
                {commentsData.map((comment) => (
                  <div key={comment.id} className="flex space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                      <AvatarFallback className="bg-chosen-blue text-white">
                        {comment.author.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{comment.author.name}</h4>
                          <p className="text-xs text-gray-400">
                            {formatDistanceToNow(comment.timestamp)} ago
                          </p>
                        </div>
                        <p className="text-sm mt-1">{comment.content}</p>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 ml-2">
                        <button className="text-xs text-gray-500 hover:text-gray-700">Like</button>
                        <button className="text-xs text-gray-500 hover:text-gray-700">Reply</button>
                        <span className="text-xs text-gray-500">{comment.likes} likes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                No comments yet. Be the first to comment!
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PostCard;
