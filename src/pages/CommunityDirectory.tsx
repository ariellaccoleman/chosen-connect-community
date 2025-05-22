
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentProfile } from "@/hooks/profiles";
import { useCommunityProfiles } from "@/hooks/profiles";
import CommunitySearch from "@/components/community/CommunitySearch";
import ProfileGrid from "@/components/community/ProfileGrid";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EntityType } from "@/types/entityTypes";
import { useFilterByTag } from "@/hooks/tags";
import { logger } from "@/utils/logger";
import { supabase } from "@/integrations/supabase/client";
import TagSelector from "@/components/tags/TagSelector";
import { Tag } from "@/utils/tags";

const CommunityDirectory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Use the tag filtering hook
  const { data: tagAssignments = [], isLoading: tagAssignmentsLoading } = useFilterByTag(selectedTagId, EntityType.PERSON);
  
  // Use the current user's profile separately to ensure we always display it
  const { data: currentUserProfile } = useCurrentProfile();

  // Fetch community profiles
  const { data: allProfiles = [], isLoading, error } = useCommunityProfiles({ 
    search: searchQuery,
    isApproved: true
  });

  // Log tag data for debugging
  useEffect(() => {
    if (selectedTagId) {
      logger.debug(`Selected tag ID: ${selectedTagId}`);
      logger.debug(`Tag Assignments for ${selectedTagId}:`, tagAssignments);
      
      // Extract target_id values from the tag assignments array
      const targetProfileIds = tagAssignments.map(ta => ta.target_id);
      logger.debug(`Tagged profile IDs: ${targetProfileIds.join(', ')}`);
      
      // Log whether any profiles in our list match the assignments
      const matchingProfiles = allProfiles.filter(p => targetProfileIds.includes(p.id));
      logger.debug(`Matching profiles count: ${matchingProfiles.length}`);
    }
  }, [selectedTagId, tagAssignments, allProfiles]);

  // Manually verify tag assignments in the tag_assignments table
  const verifyTagAssignments = async () => {
    try {
      // Check assignments directly in the tag_assignments table
      logger.debug("Checking tag_assignments table directly...");
      const { data, error } = await supabase
        .from("tag_assignments")
        .select("*")
        .eq("target_type", "person");
      
      if (error) {
        logger.debug("Error querying tag_assignments:", error);
      } else {
        logger.debug(`Found ${data?.length || 0} tag assignments for people`);
        
        // If a tag is selected, check for assignments with that tag
        if (selectedTagId) {
          const filteredAssignments = data?.filter(a => a.tag_id === selectedTagId) || [];
          logger.debug(`Found ${filteredAssignments.length} assignments with selected tag ID:`);
          // Fix for error #1: Convert the array to a string using JSON.stringify
          logger.debug(JSON.stringify(filteredAssignments));
          
          // Check if any profiles match these assignments
          const taggedIds = new Set(filteredAssignments.map(a => a.target_id));
          const matchingProfiles = allProfiles.filter(p => taggedIds.has(p.id));
          logger.debug(`Direct DB check - matching profiles: ${matchingProfiles.length}`);
        }
      }
    } catch (e) {
      logger.error("Error during tag assignment verification:", e);
    }
  };

  // Run verification when necessary
  useEffect(() => {
    if (selectedTagId) {
      verifyTagAssignments();
    }
  }, [selectedTagId, allProfiles]);

  // Display error message if profile loading fails
  if (error) {
    console.error("Error loading community profiles:", error);
    toast.error("Failed to load community members. Please try again.");
  }

  // Filter profiles based on search query first
  const searchFilteredProfiles = allProfiles.filter(profile => {
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    
    return fullName.includes(searchLower) || 
           (profile.bio && profile.bio.toLowerCase().includes(searchLower)) ||
           (profile.headline && profile.headline.toLowerCase().includes(searchLower)) ||
           (profile.email && profile.email.toLowerCase().includes(searchLower));
  });
  
  // Then filter by tag using the tag assignments from the hook
  const filteredProfiles = selectedTagId
    ? searchFilteredProfiles.filter(profile => {
        // Create a Set of target_ids from the tag assignments for efficient lookup
        const taggedIds = new Set(tagAssignments.map(ta => ta.target_id));
        
        // Check if the profile ID is in the set of tagged IDs
        const isIncluded = taggedIds.has(profile.id);
        
        // Debug check for current user's profile
        // Fix for error #2: Access the id property correctly through the data property
        if (currentUserProfile?.data && profile.id === currentUserProfile.data.id) {
          logger.debug(`Current user (${profile.id}) included in filtered results: ${isIncluded}`);
        }
        
        return isIncluded;
      })
    : searchFilteredProfiles;

  // Handle tag selection
  const handleTagSelected = (tag: Tag) => {
    setSelectedTagId(tag.id || null);
    logger.debug(`Tag selected: ${tag.name} (${tag.id})`);
  };

  // Clear tag filter
  const clearTagFilter = () => {
    setSelectedTagId(null);
  };

  return (
    <div className="container max-w-6xl px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Community Directory
        </h1>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <CommunitySearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            </div>
            <div className="md:w-64">
              <TagSelector
                targetType={EntityType.PERSON}
                onTagSelected={handleTagSelected}
                currentSelectedTagId={selectedTagId}
              />
              {selectedTagId && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearTagFilter}
                  className="mt-2"
                >
                  Clear filter
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ProfileGrid 
        profiles={filteredProfiles} 
        isLoading={isLoading || (!!selectedTagId && tagAssignmentsLoading)} 
        searchQuery={searchQuery} 
      />
    </div>
  );
};

export default CommunityDirectory;
