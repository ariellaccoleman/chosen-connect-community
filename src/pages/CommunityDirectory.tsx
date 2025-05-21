
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
import { useSelectionTags } from "@/hooks/tags";
import { ProfileWithDetails } from "@/types";

const CommunityDirectory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const { user } = useAuth();
  
  // Use the hooks for tags
  const { data: tagsResponse, isLoading: isTagsLoading } = useSelectionTags(EntityType.PERSON);
  
  // Use the current user's profile separately to ensure we always display it
  const { data: currentUserProfile } = useCurrentProfile();

  // Fetch community profiles
  const { data: allProfiles = [], isLoading, error } = useCommunityProfiles({ 
    search: searchQuery,
    isApproved: true
  });

  // Client-side filtering for tags (since the backend filtering isn't working properly)
  const filteredProfiles = selectedTagIds.length > 0 
    ? allProfiles.filter(profile => 
        profile.tags && 
        profile.tags.some(tag => selectedTagIds.includes(tag.tag_id))
      )
    : allProfiles;

  // Display error message if profile loading fails
  if (error) {
    console.error("Error loading community profiles:", error);
    toast.error("Failed to load community members. Please try again.");
  }

  // Extract tags from the response
  const tags = tagsResponse?.data || [];

  return (
    <div className="container max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
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
                selectedTagIds={selectedTagIds}
                onTagsSelect={setSelectedTagIds}
                tags={tags}
                isLoading={isTagsLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <ProfileGrid profiles={filteredProfiles} isLoading={isLoading} searchQuery={searchQuery} />
    </div>
  );
};

export default CommunityDirectory;
