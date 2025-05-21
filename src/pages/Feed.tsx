
import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import PostComposer from "@/components/feed/PostComposer";
import PostList from "@/components/feed/PostList";
import TagFilter from "@/components/filters/TagFilter";
import { useSelectionTags } from "@/hooks/tags";
import { EntityType } from "@/types/entityTypes";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

const Feed: React.FC = () => {
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const { data: tagsResponse } = useSelectionTags(EntityType.POST);
  const tags = tagsResponse?.data || [];
  const { user } = useAuth();
  
  console.log("Feed page rendered, auth user:", user);

  const handleTagSelect = (tagId: string | null) => {
    setSelectedTagId(tagId);
  };

  return (
    <Layout>
      <div className="container py-4 sm:py-8 px-4 sm:px-6 max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Feed</h1>
        
        {/* Post composer - only show when logged in */}
        {user ? (
          <div className="mb-4 sm:mb-6">
            <PostComposer />
          </div>
        ) : (
          <div className="mb-4 sm:mb-6 bg-gray-50 p-4 rounded-lg text-center">
            <p className="mb-3 text-gray-600">Sign in to create posts and interact with the community</p>
            <Button asChild className="bg-chosen-blue hover:bg-chosen-navy">
              <a href="/auth">
                <User className="h-4 w-4 mr-2" />
                Sign In
              </a>
            </Button>
          </div>
        )}
        
        {/* Tag filter */}
        <div className="mb-4 sm:mb-6">
          <TagFilter
            selectedTagId={selectedTagId}
            onTagSelect={handleTagSelect}
            tags={tags}
            label="Filter posts by tag"
          />
        </div>
        
        {/* Feed content */}
        <div className="space-y-4">
          <PostList selectedTagId={selectedTagId} />
        </div>
      </div>
    </Layout>
  );
};

export default Feed;
