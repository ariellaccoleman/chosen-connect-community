
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentProfile } from "@/hooks/profiles";
import { useCommunityProfiles } from "@/hooks/profiles";
import CommunitySearch from "@/components/community/CommunitySearch";
import ProfileGrid from "@/components/community/ProfileGrid";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent } from "@/components/ui/card";
import { EntityType } from "@/types/entityTypes";
import { useFilterByTag } from "@/hooks/tags";
import { logger } from "@/utils/logger";
import { supabase } from "@/integrations/supabase/client";
import TagDebugTool from "@/components/filters/TagDebugTool";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";
import TagSelector from "@/components/tags/TagSelector";
import { Tag } from "@/utils/tags";

const CommunityDirectory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [showDebugTool, setShowDebugTool] = useState(false);
  const { user } = useAuth();
  
  // Use the tag filtering hook
  const { data: tagAssignments = [] } = useFilterByTag(selectedTagId, EntityType.PERSON);
  
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
      
      const targetProfileId = "95ad82bb-4109-4f88-8155-02231dda3b85";
      const isTargetProfileTagged = tagAssignments.some(ta => ta.target_id === targetProfileId);
      
      logger.debug(`Is target profile ${targetProfileId} in tag assignments? ${isTargetProfileTagged}`);
    }
  }, [selectedTagId, tagAssignments]);

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
    } catch (e) {
      logger.error("Error during tag assignment verification:", e);
    }
  };

  // Run verification when necessary
  useEffect(() => {
    if (selectedTagId === "2de8fd5d-3311-4e38-94a3-596ee596524b") {
      verifyTagAssignments();
    }
  }, [selectedTagId]);

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
        // Use the tag assignments from the useFilterByTag hook
        const taggedIds = new Set(tagAssignments.map((ta) => ta.target_id));
        
        // Check if the profile ID is in the set of tagged IDs
        const isIncluded = taggedIds.has(profile.id);
        
        // Extra logging for the specific target profile
        if (profile.id === "95ad82bb-4109-4f88-8155-02231dda3b85") {
          logger.debug(`Target profile filtering: is included = ${isIncluded}`);
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
              <div className="text-sm text-muted-foreground mb-2">
                Filter by interest:
              </div>
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

      <ProfileGrid profiles={filteredProfiles} isLoading={isLoading} searchQuery={searchQuery} />
    </div>
  );
};

export default CommunityDirectory;
