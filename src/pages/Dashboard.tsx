
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import ProfileSummaryCard from "@/components/dashboard/ProfileSummaryCard";
import OrganizationSection from "@/components/dashboard/OrganizationSection";
import EventSection from "@/components/dashboard/EventSection";
import { useProfileById } from "@/hooks/profiles";
import { usePublicProfileOrganizations } from "@/hooks/usePublicProfileOrganizations";
import { usePublicProfileTags } from "@/hooks/usePublicProfileTags";
import { ProfileWithDetails } from "@/types";

const Dashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { data: profileData } = useProfileById(user?.id);
  const { data: relationships = [], isLoading: isLoadingOrgs } = usePublicProfileOrganizations(user?.id);
  const { data: tagAssignments = [], isLoading: isLoadingTags } = usePublicProfileTags(user?.id);
  
  // Extract the profile data from the API response
  const profile = profileData?.data;
  
  // If the profile is loaded, add the isAdmin flag and tags to it
  const profileWithAdminStatus = profile ? {
    ...profile,
    role: isAdmin ? "admin" : profile.role || "member",
    tags: tagAssignments // Add tags to the profile data
  } : null;
  
  // Debug admin status
  console.log("Dashboard - User admin status:", { 
    email: user?.email,
    isAdmin, 
    userMetadata: user?.user_metadata,
    profileRole: profile?.role,
    mergedRole: profileWithAdminStatus?.role
  });
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="flex flex-col space-y-6">
        {profileWithAdminStatus && <ProfileSummaryCard profile={profileWithAdminStatus} />}
        <OrganizationSection relationships={relationships} isLoading={isLoadingOrgs} />
        <EventSection />
      </div>
    </div>
  );
};

export default Dashboard;
