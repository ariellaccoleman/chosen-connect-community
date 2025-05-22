
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
import { supabase } from "@/integrations/supabase/client";
import TagDebugTool from "@/components/filters/TagDebugTool";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";

const CommunityDirectory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showDebugTool, setShowDebugTool] = useState(false);
  const { user } = useAuth();
  
  // Use the hooks for tags - now uses the improved useSelectionTags hook
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
      logger.debug("Community Directory - Available tags:", tagsResponse.data.length);
      
      // Log all available tags
      logger.debug("Available tags:", tagsResponse.data.map(tag => ({ id: tag.id, name: tag.name })));
      
      // Find and log the specific target tag
      const targetTagId = "2de8fd5d-3311-4e38-94a3-596ee596524b";
      const targetTag = tagsResponse.data.find(tag => tag.id === targetTagId);
      if (targetTag) {
        logger.debug("Found target tag:", targetTag);
      } else {
        logger.debug("Target tag not found in available tags");
      }
    }
  }, [tagsResponse?.data]);

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
        logger.error("Error querying tag_assignments:", error);
      } else {
        logger.debug(`Found ${data?.length || 0} tag assignments for people`);
        
        // Look for specific assignment
        const targetTagId = "2de8fd5d-3311-4e38-94a3-596ee596524b";
        const targetProfileId = "95ad82bb-4109-4f88-8155-02231dda3b85";
        
        const targetAssignment = data?.find(a => 
          a.tag_id === targetTagId && a.target_id === targetProfileId
        );
        
        if (targetAssignment) {
          logger.debug("Found target tag assignment:", targetAssignment);
        } else {
          logger.debug("Target tag assignment NOT found in raw table data");
        }
      }
      
      // Check raw profiles data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", "95ad82bb-4109-4f88-8155-02231dda3b85")
        .single();
        
      if (profileError) {
        logger.error("Error querying profile:", profileError);
      } else {
        logger.debug("Raw profile data:", profileData);
      }
    } catch (e) {
      logger.error("Error during tag assignment verification:", e);
    }
  };

  // Direct query to verify tag assignment - run when needed
  useEffect(() => {
    if (selectedTagIds.includes("2de8fd5d-3311-4e38-94a3-596ee596524b")) {
      verifyTagAssignments();
    }
  }, [selectedTagIds]);

  // Debug profiles with tags
  useEffect(() => {
    if (allProfiles.length > 0) {
      // Log profiles with tags
      const profilesWithTags = allProfiles.filter(p => p.tags && p.tags.length > 0);
      logger.debug(`Profiles with tags: ${profilesWithTags.length} out of ${allProfiles.length}`);
      
      const targetProfileId = "95ad82bb-4109-4f88-8155-02231dda3b85";
      const targetProfile = allProfiles.find(p => p.id === targetProfileId);
      
      if (targetProfile) {
        logger.debug("Target profile found:", {
          id: targetProfile.id,
          name: `${targetProfile.first_name} ${targetProfile.last_name}`,
          tagCount: targetProfile.tags?.length || 0
        });
        
        if (targetProfile.tags) {
          logger.debug("Target profile tags:", targetProfile.tags.map(t => ({
            id: t.id,
            tag_id: t.tag_id,
            tag: t.tag ? t.tag.name : 'unknown'
          })));
        }
      } else {
        logger.debug("Target profile not found in fetched profiles");
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

  // Improved client-side filtering for tags with direct tag ID check
  const filteredProfiles = selectedTagIds.length > 0 
    ? allProfiles.filter(profile => {
        // Enhanced debugging for the specific profile we're looking for
        const isTargetProfile = profile.id === "95ad82bb-4109-4f88-8155-02231dda3b85";
        
        if (isTargetProfile) {
          logger.debug("Checking target profile during filtering:", {
            id: profile.id,
            name: `${profile.first_name} ${profile.last_name}`,
            hasTags: !!profile.tags,
            tagCount: profile.tags?.length || 0
          });
        }
        
        // Make sure profile has tags array
        if (!profile.tags || profile.tags.length === 0) {
          if (isTargetProfile) {
            logger.debug("Target profile has no tags");
          }
          return false;
        }
        
        // Check if any of the selected tags are on the profile
        const hasSelectedTag = profile.tags.some(tag => {
          const tagMatch = selectedTagIds.includes(tag.tag_id);
          
          if (isTargetProfile) {
            logger.debug(`Tag ${tag.tag_id} match: ${tagMatch}`);
          }
          
          return tagMatch;
        });
        
        if (isTargetProfile) {
          logger.debug(`Target profile match result: ${hasSelectedTag}`);
        }
        
        return hasSelectedTag;
      })
    : allProfiles;
  
  // Log filtered profiles
  useEffect(() => {
    if (selectedTagIds.length > 0) {
      logger.debug(`Filtered to ${filteredProfiles.length} profiles out of ${allProfiles.length}`);
      
      const targetProfileId = "95ad82bb-4109-4f88-8155-02231dda3b85";
      const hasTargetProfile = filteredProfiles.some(p => p.id === targetProfileId);
      
      logger.debug(`Target profile (${targetProfileId}) is ${hasTargetProfile ? 'INCLUDED' : 'NOT INCLUDED'} in filtered results`);
      
      if (filteredProfiles.length > 0) {
        logger.debug("First few filtered profiles:", 
          filteredProfiles.slice(0, 3).map(p => ({ 
            id: p.id, 
            name: `${p.first_name} ${p.last_name}`,
            tags: p.tags?.map(t => ({id: t.tag_id, name: t.tag?.name}))
          }))
        );
      }
    }
  }, [filteredProfiles.length, allProfiles.length, selectedTagIds.length, filteredProfiles]);

  // Display error message if profile loading fails
  if (error) {
    console.error("Error loading community profiles:", error);
    toast.error("Failed to load community members. Please try again.");
  }

  // Extract tags from the response
  const tags = tagsResponse?.data || [];

  return (
    <div className="container max-w-6xl px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Community Directory
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDebugTool(!showDebugTool)}
        >
          <Wrench className="h-4 w-4 mr-2" />
          {showDebugTool ? "Hide Debug" : "Show Debug"}
        </Button>
      </div>

      {showDebugTool && (
        <TagDebugTool 
          tagId="2de8fd5d-3311-4e38-94a3-596ee596524b"
          profileId="95ad82bb-4109-4f88-8155-02231dda3b85"
        />
      )}

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
                label="Filter by interest"
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
