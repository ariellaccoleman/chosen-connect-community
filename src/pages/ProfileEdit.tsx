
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentProfile, useUpdateProfile } from "@/hooks/profiles";
import { useAddOrganizationRelationship } from "@/hooks/organizations";
import ProfileForm, { ProfileFormValues } from "@/components/profile/ProfileForm";
import { toast } from "@/components/ui/sonner";
import { formatProfileUrls } from "@/utils/formatters/urlFormatters";

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const { data: profileData, isLoading: isLoadingProfile } = useCurrentProfile(user?.id);
  const updateProfile = useUpdateProfile();
  const addOrganizationRelationship = useAddOrganizationRelationship();
  const profile = profileData?.data;

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (data: ProfileFormValues) => {
    if (!user?.id) return;

    try {
      // Format URLs before submission
      const profileData = {
        first_name: data.first_name,
        last_name: data.last_name,
        headline: data.headline || null,
        bio: data.bio || null,
        location_id: data.location_id || null,
        ...formatProfileUrls({
          website_url: data.website_url,
          linkedin_url: data.linkedin_url,
          twitter_url: data.twitter_url
        }),
        avatar_url: data.avatar_url || null,
      };
      
      await updateProfile.mutateAsync({
        id: user.id,
        data: profileData
      });
      
      navigate("/dashboard");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    }
  };
  
  const handleAddOrganization = async (data: {
    organizationId: string;
    connectionType: "current" | "former" | "connected_insider";
    department: string | null;
    notes: string | null;
  }) => {
    if (!user?.id) return;
    
    try {
      await addOrganizationRelationship.mutateAsync({
        profile_id: user.id,
        organization_id: data.organizationId,
        connection_type: data.connectionType,
        department: data.department,
        notes: data.notes
      });
      
      toast.success("Organization relationship added successfully!");
    } catch (error) {
      console.error("Error adding organization relationship:", error);
      toast.error("Failed to add organization. Please try again.");
    }
  };
  
  const handleNavigateToManageOrgs = () => {
    navigate("/organizations/manage-connections");
  };

  if (loading || isLoadingProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 font-heading">Edit Your Profile</h1>
      
      <ProfileForm 
        profile={profile}
        isSubmitting={updateProfile.isPending}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/dashboard")}
        onAddOrganization={handleAddOrganization}
        onNavigateToManageOrgs={handleNavigateToManageOrgs}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default ProfileEdit;
