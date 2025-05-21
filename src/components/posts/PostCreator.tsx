
import React, { useState } from 'react';
import { useCreatePost } from '@/hooks/posts';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Image, Link, PlaySquare } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// Create schema for post validation
const postSchema = z.object({
  content: z.string().min(1, "Post content cannot be empty"),
});

type PostFormValues = z.infer<typeof postSchema>;

const PostCreator = () => {
  const { user } = useAuth();
  const { mutateAsync: createPost, isPending } = useCreatePost();
  const [mediaType, setMediaType] = useState<string | null>(null);
  
  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: '',
    }
  });
  
  const onSubmit = async (values: PostFormValues) => {
    if (!values.content.trim()) return;
    
    try {
      await createPost({
        content: values.content.trim(),
        has_media: false, // We'll add media support later
      });
      
      // Reset form after successful post
      form.reset();
      setMediaType(null);
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback>
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="What's on your mind?"
                    className="resize-none min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {mediaType && (
          <div className="p-4 border rounded-md border-dashed flex items-center justify-center">
            <p className="text-muted-foreground">
              Media upload will be implemented in a future update
            </p>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <Tabs value={mediaType || "none"} onValueChange={setMediaType}>
            <TabsList>
              <TabsTrigger value="image" className="flex gap-1">
                <Image className="h-4 w-4" />
                <span className="hidden sm:inline">Photo</span>
              </TabsTrigger>
              <TabsTrigger value="video" className="flex gap-1">
                <PlaySquare className="h-4 w-4" />
                <span className="hidden sm:inline">Video</span>
              </TabsTrigger>
              <TabsTrigger value="link" className="flex gap-1">
                <Link className="h-4 w-4" />
                <span className="hidden sm:inline">Link</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : "Post"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PostCreator;
