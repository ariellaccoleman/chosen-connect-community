
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import ProfileSummaryCard from "@/components/dashboard/ProfileSummaryCard";
import OrganizationSection from "@/components/dashboard/OrganizationSection";
import EventSection from "@/components/dashboard/EventSection";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <ProfileSummaryCard />
        
        <div className="space-y-6">
          <OrganizationSection />
          <EventSection />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
