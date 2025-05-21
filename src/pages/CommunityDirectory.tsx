
import { useState, useEffect } from "react";
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
import { logger } from "@/utils/logger";

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

  // Debug tag data
  useEffect(() => {
    if (tagsResponse?.data) {
      logger.debug("Available tags:", tagsResponse.data);
      
      // Find and log the Campus Issues tag
      const campusIssuesTag = tagsResponse.data.find(tag => tag.name === "Campus Issues");
      if (campusIssuesTag) {
        logger.debug("Found Campus Issues tag:", campusIssuesTag);
      } else {
        logger.debug("Campus Issues tag not found in available tags");
      }
    }
  }, [tagsResponse?.data]);

  // Debug profiles with tags
  useEffect(() => {
    if (allProfiles.length > 0) {
      // Log profiles with tags
      const profilesWithTags = allProfiles.filter(p => p.tags && p.tags.length > 0);
      logger.debug(`Profiles with tags: ${profilesWithTags.length} out of ${allProfiles.length}`);
      
      // Look for profiles with Campus Issues tag
      const campusIssuesProfiles = allProfiles.filter(profile => 
        profile.tags && profile.tags.some(tag => tag.tag && tag.tag.name === "Campus Issues")
      );
      
      if (campusIssuesProfiles.length > 0) {
        logger.debug(`Found ${campusIssuesProfiles.length} profiles with Campus Issues tag:`, 
          campusIssuesProfiles.map(p => ({ id: p.id, name: `${p.first_name} ${p.last_name}` }))
        );
      } else {
        logger.debug("No profiles found with Campus Issues tag");
      }
    }
  }, [allProfiles]);

  // Debug tag filtering when selectedTagIds changes
  useEffect(() => {
    if (selectedTagIds.length > 0) {
      logger.debug("Selected tag IDs:", selectedTagIds);
      
      // Get tag names for debugging
      const selectedTagNames = tagsResponse?.data
        ?.filter(tag => selectedTagIds.includes(tag.id))
        .map(tag => tag.name);
      
      logger.debug("Selected tag names:", selectedTagNames);
    }
  }, [selectedTagIds, tagsResponse?.data]);

  // Client-side filtering for tags (since the backend filtering isn't working properly)
  const filteredProfiles = selectedTagIds.length > 0 
    ? allProfiles.filter(profile => 
        profile.tags && 
        profile.tags.some(tag => selectedTagIds.includes(tag.tag_id))
      )
    : allProfiles;
  
  // Log filtered profiles
  useEffect(() => {
    if (selectedTagIds.length > 0) {
      logger.debug(`Filtered to ${filteredProfiles.length} profiles out of ${allProfiles.length}`);
    }
  }, [filteredProfiles.length, allProfiles.length, selectedTagIds.length]);

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
