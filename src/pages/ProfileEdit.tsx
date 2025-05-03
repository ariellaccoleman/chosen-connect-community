
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentProfile, useUpdateProfile } from "@/hooks/useProfiles";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProfileForm, { ProfileFormValues } from "@/components/profile/ProfileForm";

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: profile, isLoading: isLoadingProfile } = useCurrentProfile(user?.id);
  const updateProfile = useUpdateProfile();

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
          avatar_url: data.avatar_url || null,
          location_id: data.location_id || null,
        }
      });
      
      navigate("/dashboard");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
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
        />
      </div>
    </DashboardLayout>
  );
};

export default ProfileEdit;
