
import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import PostComposer from "@/components/feed/PostComposer";
import PostList from "@/components/feed/PostList";
import { Card } from "@/components/ui/card";
import TagFilter from "@/components/filters/TagFilter";
import { useSelectionTags } from "@/hooks/tags";
import { EntityType } from "@/types/entityTypes";

const Feed: React.FC = () => {
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const { data: tagsResponse } = useSelectionTags(EntityType.POST);
  const tags = tagsResponse?.data || [];

  const handleTagSelect = (tagId: string | null) => {
    setSelectedTagId(tagId);
  };

  return (
    <Layout>
      <div className="container py-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Feed</h1>
        
        {/* Tag filter */}
        <div className="mb-6">
          <TagFilter
            selectedTagId={selectedTagId}
            onTagSelect={handleTagSelect}
            tags={tags}
            label="Filter posts by tag"
          />
        </div>
        
        {/* Post composer */}
        <div className="mb-6">
          <PostComposer />
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
