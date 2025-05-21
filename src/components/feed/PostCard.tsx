
import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Send } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Post, PostComment } from "@/types/post";
import { 
  useCreateComment, 
  useHasLikedPost, 
  usePostComments, 
  useTogglePostLike,
  useToggleCommentLike,
  useHasLikedComment
} from "@/hooks/posts";
import { Skeleton } from "@/components/ui/skeleton";

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  
  // Load comments when comment section is shown
  const { 
    data: commentsResponse,
    isLoading: commentsLoading 
  } = usePostComments(post.id, { enabled: showComments });
  
  // Check if user has liked this post
  const { data: hasLikedResponse } = useHasLikedPost(post.id);
  
  // Get mutation to toggle like
  const toggleLikeMutation = useTogglePostLike(post.id);
  
  // Get mutation to create comment
  const createCommentMutation = useCreateComment(post.id);
  
  // Extract comments from response
  const comments = commentsResponse?.data || [];
  
  // Determine if user has liked the post
  const hasLiked = hasLikedResponse?.data || false;
  
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    try {
      await createCommentMutation.mutateAsync({
        post_id: post.id,
        content: commentText
      });
      
      // Clear comment text after submission
      setCommentText("");
    } catch (error) {
      console.error("Failed to submit comment:", error);
    }
  };
  
  const toggleComments = () => {
    setShowComments(!showComments);
  };
  
  const handleToggleLike = () => {
    toggleLikeMutation.mutate();
  };
  
  // Format likes and comments count with proper pluralization
  const likesText = post.likes_count === 1 ? "1 like" : `${post.likes_count || 0} likes`;
  const commentsText = post.comments_count === 1 ? "1 comment" : `${post.comments_count || 0} comments`;
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Post header */}
        <div className="p-4 flex items-start">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author?.avatar} alt={post.author?.name} />
              <AvatarFallback className="bg-chosen-blue text-white">
                {post.author?.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-sm">{post.author?.name || 'Unknown'}</h3>
              <p className="text-xs text-gray-500">{post.author?.title || ''}</p>
              <p className="text-xs text-gray-400">
                {post.created_at ? formatDistanceToNow(new Date(post.created_at)) + ' ago' : ''}
              </p>
            </div>
          </div>
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
        
        {/* Post stats - Updated with proper pluralization */}
        <div className="px-4 py-2 flex justify-between items-center text-xs text-gray-500">
          <span>{likesText}</span>
          <span>{commentsText}</span>
        </div>
        
        <Separator />
        
        {/* Action buttons */}
        <CardFooter className="px-2 py-1 flex justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex-1 ${hasLiked ? 'text-red-600' : 'text-gray-600'}`}
            onClick={handleToggleLike}
          >
            <Heart className={`h-4 w-4 mr-2 ${hasLiked ? 'fill-current' : ''}`} />
            {hasLiked ? 'Liked' : 'Like'}
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
                  disabled={createCommentMutation.isPending}
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    size="sm"
                    className="bg-chosen-blue hover:bg-chosen-navy"
                    disabled={!commentText.trim() || createCommentMutation.isPending}
                  >
                    {createCommentMutation.isPending ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Posting...
                      </span>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-1" />
                        Post
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
            
            {/* Comment list */}
            {commentsLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex space-x-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-20 w-full rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} postId={post.id} />
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

// Extract comment item to a separate component for better organization
interface CommentItemProps {
  comment: PostComment;
  postId: string;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, postId }) => {
  const { data: hasLikedResponse } = useHasLikedComment(comment.id);
  const toggleLikeMutation = useToggleCommentLike(comment.id, postId);
  
  const hasLiked = hasLikedResponse?.data || false;
  
  const handleToggleLike = () => {
    toggleLikeMutation.mutate();
  };
  
  // Format comment likes with proper pluralization
  const likesText = comment.likes === 1 ? "1 like" : `${comment.likes || 0} likes`;
  
  return (
    <div className="flex space-x-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.author?.avatar} alt={comment.author?.name} />
        <AvatarFallback className="bg-chosen-blue text-white">
          {comment.author?.name?.charAt(0) || '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">{comment.author?.name}</h4>
            <p className="text-xs text-gray-400">
              {comment.timestamp ? formatDistanceToNow(new Date(comment.timestamp)) + ' ago' : ''}
            </p>
          </div>
          <p className="text-sm mt-1">{comment.content}</p>
        </div>
        <div className="flex items-center space-x-4 mt-1 ml-2">
          <button 
            className={`text-xs ${hasLiked ? 'text-red-600' : 'text-gray-500'} hover:text-gray-700`}
            onClick={handleToggleLike}
          >
            {hasLiked ? 'Liked' : 'Like'}
          </button>
          <span className="text-xs text-gray-500">{likesText}</span>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
