
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useProfiles } from "@/hooks/useProfiles";
import { useCommunityProfiles } from "@/hooks/useCommunityProfiles";
import CommunitySearch from "@/components/community/CommunitySearch";
import ProfileGrid from "@/components/community/ProfileGrid";
import { toast } from "@/components/ui/sonner";
import TagFilter from "@/components/filters/TagFilter";
import { Card, CardContent } from "@/components/ui/card";

const CommunityDirectory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Use the current user's profile separately to ensure we always display it
  const { data: currentUserProfile } = useProfiles(user?.id || "");

  // Fetch all community profiles with proper filter object
  const { data: profiles, isLoading, error } = useCommunityProfiles({ 
    search: searchQuery,
    isApproved: true, // Explicitly request only approved profiles
    tagId: selectedTagId
  });

  useEffect(() => {
    if (error) {
      console.error("Error loading community profiles:", error);
      toast.error("Failed to load community members. Please try again.");
    }
  }, [error]);

  // Combine and deduplicate profiles
  const allProfiles = profiles || [];

  return (
    <DashboardLayout>
      <div className="container max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Community Directory
        </h1>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <CommunitySearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            
            <TagFilter 
              selectedTagId={selectedTagId} 
              onSelectTag={setSelectedTagId}
              entityType="person"
            />
          </CardContent>
        </Card>

        <ProfileGrid profiles={allProfiles} isLoading={isLoading} searchQuery={searchQuery} />
      </div>
    </DashboardLayout>
  );
};

export default CommunityDirectory;
