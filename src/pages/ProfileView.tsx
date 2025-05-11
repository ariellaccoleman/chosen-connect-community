
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { usePublicProfileOrganizations } from "@/hooks/usePublicProfileOrganizations";
import { usePublicProfileTags } from "@/hooks/usePublicProfileTags";
import PublicProfileHeader from "@/components/profile/PublicProfileHeader";
import PublicProfileOrganizations from "@/components/profile/PublicProfileOrganizations";
import PublicProfileTags from "@/components/profile/PublicProfileTags";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const ProfileView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { 
    data: profile, 
    isLoading: isLoadingProfile, 
    error: profileError 
  } = usePublicProfile(id);
  
  const { 
    data: organizations = [], 
    isLoading: isLoadingOrgs 
  } = usePublicProfileOrganizations(id);
  
  const { 
    data: tagAssignments = [], 
    isLoading: isLoadingTags 
  } = usePublicProfileTags(id);

  useEffect(() => {
    if (profileError) {
      console.error("Error loading profile:", profileError);
      toast.error("Failed to load profile information.");
    }
  }, [profileError]);

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoadingProfile) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-40 bg-gray-100 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-40 bg-gray-100 rounded-lg"></div>
            <div className="h-40 bg-gray-100 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="outline"
          size="sm"
          className="mb-6"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
          <p className="text-gray-600">The profile you're looking for does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Button
        variant="outline"
        size="sm"
        className="mb-6"
        onClick={handleBack}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="space-y-6">
        <PublicProfileHeader profile={profile} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PublicProfileOrganizations 
            relationships={organizations}
            isLoading={isLoadingOrgs}
          />
          <PublicProfileTags
            tagAssignments={tagAssignments}
            isLoading={isLoadingTags}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
