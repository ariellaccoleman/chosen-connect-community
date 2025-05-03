
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentProfile, useUpdateProfile } from "@/hooks/useProfiles";
import { useAddOrganizationRelationship } from "@/hooks/useOrganizations";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProfileForm, { ProfileFormValues } from "@/components/profile/ProfileForm";
import { toast } from "@/components/ui/sonner";

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: profile, isLoading: isLoadingProfile } = useCurrentProfile(user?.id);
  const updateProfile = useUpdateProfile();
  const addOrganizationRelationship = useAddOrganizationRelationship();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (data: ProfileFormValues) => {
    if (!user?.id) return;

    try {
      await updateProfile.mutateAsync({
        profileId: user.id,
        profileData: {
          ...data,
          // Clean empty strings to null for optional fields
          headline: data.headline || null,
          bio: data.bio || null,
          linkedin_url: data.linkedin_url || null,
          twitter_url: data.twitter_url || null,
          website_url: data.website_url || null,
          avatar_url: data.avatar_url || null,
          location_id: data.location_id || null,
        }
      });
      
      navigate("/dashboard");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    }
  };
  
  const handleAddOrganization = async (data: {
    organizationId: string;
    connectionType: "current" | "former" | "ally";
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
    navigate("/organizations/manage");
  };

  if (loading || isLoadingProfile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6 font-heading">Edit Your Profile</h1>
        
        <ProfileForm 
          profile={profile}
          isSubmitting={updateProfile.isPending}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/dashboard")}
          onAddOrganization={handleAddOrganization}
          onNavigateToManageOrgs={handleNavigateToManageOrgs}
        />
      </div>
    </DashboardLayout>
  );
};

export default ProfileEdit;
