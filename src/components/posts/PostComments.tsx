
import React, { useState } from 'react';
import { usePostComments, useCreateComment, useDeleteComment, useCommentDeletePermission } from '@/hooks/posts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface PostCommentsProps {
  postId: string;
}

const PostComments = ({ postId }: PostCommentsProps) => {
  const { user } = useAuth();
  const { data: comments = [], isLoading, error } = usePostComments(postId);
  const [newComment, setNewComment] = useState('');
  const { mutateAsync: createComment, isPending: isCreating } = useCreateComment();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !newComment.trim()) return;
    
    try {
      await createComment({
        postId,
        content: newComment.trim()
      });
      setNewComment('');
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  return (
    <div className="space-y-4">
      <Separator />
      
      {/* Comment creation input */}
      {user && (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback>
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1"
              disabled={isCreating}
            />
            <Button type="submit" size="sm" disabled={!newComment.trim() || isCreating}>
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
            </Button>
          </div>
        </form>
      )}
      
      {/* Comments list */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          <>
            <CommentSkeleton />
            <CommentSkeleton />
          </>
        ) : error ? (
          <p className="text-red-500 text-sm">Error loading comments</p>
        ) : comments.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center p-2">No comments yet</p>
        ) : (
          // Render actual comments
          comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} postId={postId} />
          ))
        )}
      </div>
    </div>
  );
};

// Comment item component
const CommentItem = ({ comment, postId }: { comment: any; postId: string }) => {
  const { user } = useAuth();
  const { mutateAsync: deleteComment, isPending: isDeleting } = useDeleteComment();
  const { data: canDelete = false } = useCommentDeletePermission(user?.id, comment.id);
  
  const handleDelete = async () => {
    try {
      await deleteComment({ commentId: comment.id, postId });
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };
  
  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.author?.avatar_url} />
        <AvatarFallback>
          {comment.author?.first_name?.[0] || 'U'}
          {comment.author?.last_name?.[0] || ''}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <div className="bg-muted p-3 rounded-lg">
          <div className="flex justify-between">
            <h4 className="font-medium text-sm">
              {comment.author?.first_name} {comment.author?.last_name}
            </h4>
            
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0" disabled={isDeleting}>
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this comment? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <p className="text-sm">{comment.content}</p>
        </div>
        
        <p className="text-xs text-muted-foreground ml-2 mt-1">
          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
};

// Skeleton for loading state
const CommentSkeleton = () => (
  <div className="flex gap-3">
    <Skeleton className="h-8 w-8 rounded-full" />
    <div className="flex-1">
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-3 w-16 mt-1 ml-2" />
    </div>
  </div>
);

export default PostComments;
