
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import ProfileSummaryCard from "@/components/dashboard/ProfileSummaryCard";
import OrganizationSection from "@/components/dashboard/OrganizationSection";
import EventSection from "@/components/dashboard/EventSection";
import { useCurrentProfile } from "@/hooks/useProfileQueries";
import { usePublicProfileOrganizations } from "@/hooks/usePublicProfileOrganizations";

const Dashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { data: profile } = useCurrentProfile(user?.id);
  const { data: relationships = [], isLoading: isLoadingOrgs } = usePublicProfileOrganizations(user?.id);
  
  // If the profile is loaded, add the isAdmin flag to it
  const profileWithAdminStatus = profile ? {
    ...profile,
    role: isAdmin ? "admin" : profile.role || "member"
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
