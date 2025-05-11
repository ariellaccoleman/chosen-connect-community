
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentProfile } from "@/hooks/useProfiles";
import { useUserOrganizationRelationships } from "@/hooks/useOrganizations";
import { Button } from "@/components/ui/button";
import ProfileSummaryCard from "@/components/dashboard/ProfileSummaryCard";
import OrganizationSection from "@/components/dashboard/OrganizationSection";
import { formatLocationWithDetails } from "@/utils/adminFormatters";
import { ProfileOrganizationRelationshipWithDetails } from "@/types";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading: isLoadingProfile } = useCurrentProfile(user?.id);
  const { data: relationships = [], isLoading: isLoadingRelationships } = useUserOrganizationRelationships(user?.id);

  // Format relationships to ensure they meet the ProfileOrganizationRelationshipWithDetails type
  const formattedRelationships: ProfileOrganizationRelationshipWithDetails[] = relationships.map(rel => {
    // Ensure the organization and its location have the expected structure
    const organization = {
      ...rel.organization,
      location: rel.organization.location ? formatLocationWithDetails(rel.organization.location) : undefined
    };
    
    return {
      ...rel,
      organization
    };
  });

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="mb-4">Your profile is not complete. Please set up your profile to continue.</p>
        <Button onClick={() => navigate("/profile")} className="bg-chosen-blue">
          Set Up Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8 font-heading">Your Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-12">
        {/* Profile Summary Card */}
        <div className="md:col-span-4">
          <ProfileSummaryCard profile={profile} />
        </div>
        
        {/* Organizations Section */}
        <div className="md:col-span-8 space-y-6">
          <OrganizationSection 
            relationships={formattedRelationships}
            isLoading={isLoadingRelationships}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
