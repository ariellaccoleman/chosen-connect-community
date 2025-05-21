
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentProfile } from "@/hooks/profiles";
import { Image, Video, Send, Tag } from "lucide-react";
import TagSelector from "@/components/tags/TagSelector";
import { EntityType } from "@/types/entityTypes";
import { Tag as TagType } from "@/utils/tags/types";
import { useCreatePost } from "@/hooks/posts";
import { useIsMobile } from "@/hooks/use-mobile";

const PostComposer: React.FC = () => {
  const [postContent, setPostContent] = useState("");
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { data: profileData } = useCurrentProfile();
  const profile = profileData?.data;
  const createPostMutation = useCreatePost();
  const isMobile = useIsMobile();

  const handlePostContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPostContent(e.target.value);
  };

  const handleTagSelected = (tag: TagType) => {
    if (!selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setShowTagSelector(false);
  };

  const handleRemoveTag = (tagId: string) => {
    setSelectedTags(selectedTags.filter(tag => tag.id !== tagId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await createPostMutation.mutateAsync({
        content: postContent,
        has_media: false,
        tag_ids: selectedTags.map(tag => tag.id)
      });
      
      // Reset form after successful submission
      setPostContent("");
      setSelectedTags([]);
      toast.success("Post created successfully!");
    } catch (error) {
      logger.error("Failed to create post:", error);
      toast.error("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = () => {
    if (!profile) return user?.email?.charAt(0).toUpperCase() || "U";

    return [profile.first_name?.[0], profile.last_name?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "User"} />
              <AvatarFallback className="bg-chosen-blue text-white">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 w-full min-w-0">
              <Textarea
                placeholder="What's on your mind?"
                className="resize-none mb-3 min-h-[100px] w-full"
                value={postContent}
                onChange={handlePostContentChange}
                disabled={isSubmitting}
              />
              
              {/* Display selected tags */}
              {selectedTags.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                      <div 
                        key={tag.id} 
                        className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center"
                      >
                        <span>{tag.name}</span>
                        <button 
                          type="button"
                          onClick={() => handleRemoveTag(tag.id)}
                          className="ml-1 text-blue-700 hover:text-blue-900"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tag selector */}
              {showTagSelector && (
                <div className="mb-3">
                  <TagSelector
                    targetType={EntityType.POST}
                    onTagSelected={handleTagSelected}
                  />
                </div>
              )}
              
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  <Button type="button" variant="ghost" size={isMobile ? "sm" : "default"} className="text-gray-600">
                    <Image className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Photo</span>
                  </Button>
                  <Button type="button" variant="ghost" size={isMobile ? "sm" : "default"} className="text-gray-600">
                    <Video className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Video</span>
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size={isMobile ? "sm" : "default"}
                    className="text-gray-600"
                    onClick={() => setShowTagSelector(!showTagSelector)}
                  >
                    <Tag className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Tag</span>
                  </Button>
                </div>
                
                <Button 
                  type="submit" 
                  className="bg-chosen-blue hover:bg-chosen-navy"
                  disabled={!postContent.trim() || isSubmitting}
                  size={isMobile ? "sm" : "default"}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="hidden sm:inline">Posting...</span>
                      <span className="sm:hidden">...</span>
                    </span>
                  ) : (
                    <>
                      <Send className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Post</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PostComposer;
