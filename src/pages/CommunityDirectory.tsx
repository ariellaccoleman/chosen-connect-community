import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentProfile } from "@/hooks/profiles";
import { useCommunityProfiles } from "@/hooks/profiles";
import CommunitySearch from "@/components/community/CommunitySearch";
import ProfileGrid from "@/components/community/ProfileGrid";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent } from "@/components/ui/card";
import TagFilter from "@/components/filters/TagFilter";
import { EntityType } from "@/types/entityTypes";
import { useSelectionTags, useFilterTags } from "@/hooks/tags";
import { Tag } from "@/utils/tags/types";

const CommunityDirectory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Use tag hooks directly from the consolidated hooks/tags module
  const { data: filterTagsResponse, isLoading: isTagsLoading } = useSelectionTags(EntityType.PERSON);
  const { data: tagAssignments = [] } = useFilterTags(selectedTagId, EntityType.PERSON);
  
  // Use the current user's profile separately to ensure we always display it
  const { data: currentUserProfile } = useCurrentProfile();

  // Fetch all community profiles with proper filter object
  const { data: profiles, isLoading, error } = useCommunityProfiles({ 
    search: searchQuery,
    isApproved: true,
    tagId: selectedTagId
  });

  // Display error message if profile loading fails
  if (error) {
    console.error("Error loading community profiles:", error);
    toast.error("Failed to load community members. Please try again.");
  }

  // Extract tags from the response - fix the structure handling
  const tags = filterTagsResponse && Array.isArray(filterTagsResponse.data) 
    ? filterTagsResponse.data.filter(Boolean) 
    : [];

  // No need to combine and deduplicate profiles anymore, just use what's returned
  const allProfiles = profiles || [];

  return (
    <div className="container max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Community Directory
      </h1>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <CommunitySearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            </div>
            <div className="md:w-64">
              <TagFilter
                selectedTagId={selectedTagId}
                onTagSelect={setSelectedTagId}
                tags={tags}
                isLoading={isTagsLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <ProfileGrid profiles={allProfiles} isLoading={isLoading} searchQuery={searchQuery} />
    </div>
  );
};

export default CommunityDirectory;
