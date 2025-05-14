
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import ProfileSummaryCard from "@/components/dashboard/ProfileSummaryCard";
import OrganizationSection from "@/components/dashboard/OrganizationSection";
import EventSection from "@/components/dashboard/EventSection";
import { useProfileQueries } from "@/hooks/useProfileQueries";
import { usePublicProfileOrganizations } from "@/hooks/usePublicProfileOrganizations";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: profile } = useProfileQueries(user?.id);
  const { data: relationships = [], isLoading: isLoadingOrgs } = usePublicProfileOrganizations(user?.id);
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {profile && <ProfileSummaryCard profile={profile} />}
        
        <div className="space-y-6">
          <OrganizationSection relationships={relationships} isLoading={isLoadingOrgs} />
          <EventSection />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
