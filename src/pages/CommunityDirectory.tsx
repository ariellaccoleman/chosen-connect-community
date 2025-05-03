
import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useProfiles } from "@/hooks/useProfiles";
import { useCommunityProfiles } from "@/hooks/useCommunityProfiles";
import CommunitySearch from "@/components/community/CommunitySearch";
import ProfileGrid from "@/components/community/ProfileGrid";

const CommunityDirectory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  
  // Use the current user's profile separately to ensure we always display it
  const { data: currentUserProfile } = useProfiles(user?.id || "");

  // Fetch all community profiles
  const { data: profiles, isLoading } = useCommunityProfiles(searchQuery);

  // Combine and deduplicate profiles
  const allProfiles = profiles || [];

  return (
    <DashboardLayout>
      <div className="container max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Community Directory
        </h1>

        <CommunitySearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <ProfileGrid profiles={allProfiles} isLoading={isLoading} searchQuery={searchQuery} />
      </div>
    </DashboardLayout>
  );
};

export default CommunityDirectory;
