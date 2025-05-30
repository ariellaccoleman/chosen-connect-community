
import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import PostComposer from "@/components/feed/PostComposer";
import PostList from "@/components/feed/PostList";
import EntitySearchAndFilter from "@/components/common/EntitySearchAndFilter";
import { EntityType } from "@/types/entityTypes";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { logger } from "@/utils/logger";

const Feed: React.FC = () => {
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { user } = useAuth();
  
  logger.debug("Feed page rendering with filters:", { 
    selectedTagId,
    searchQuery
  });

  const handleTagChange = (tagId: string | null) => {
    logger.debug(`Feed: Tag selected: ${tagId}`);
    setSelectedTagId(tagId);
  };

  const handleSearchChange = (search: string) => {
    logger.debug(`Feed: Search changed: ${search}`);
    setSearchQuery(search);
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
        
        {/* Enhanced search and filter */}
        <EntitySearchAndFilter
          entityType={EntityType.POST}
          searchPlaceholder="Search posts..."
          tagPlaceholder="Filter by tag"
          onSearchChange={handleSearchChange}
          onTagChange={handleTagChange}
          initialSearch={searchQuery}
          initialTagId={selectedTagId}
        />
        
        {/* Feed content */}
        <div className="space-y-4">
          <PostList selectedTagId={selectedTagId} searchQuery={searchQuery} />
        </div>
      </div>
    </Layout>
  );
};

export default Feed;
