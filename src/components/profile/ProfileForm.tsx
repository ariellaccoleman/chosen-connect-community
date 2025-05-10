
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { ProfileWithDetails } from "@/types";
import ProfileBasicInfo from "./ProfileBasicInfo";
import ProfileSocialLinks from "./ProfileSocialLinks";
import ProfileOrganizationLinks from "./ProfileOrganizationLinks";
import ProfileFormActions from "./form/ProfileFormActions";
import { profileSchema, ProfileFormValues } from "./schema/profileSchema";

// Re-export the type for backward compatibility
export type { ProfileFormValues } from "./schema/profileSchema";

interface ProfileFormProps {
  profile: ProfileWithDetails | null;
  isSubmitting: boolean;
  onSubmit: (data: ProfileFormValues) => void;
  onCancel: () => void;
  onAddOrganization?: (data: { 
    organizationId: string; 
    connectionType: "current" | "former" | "connected_insider"; 
    department: string | null; 
    notes: string | null
  }) => void;
  onNavigateToManageOrgs?: () => void;
}

const ProfileForm = ({
  profile,
  isSubmitting,
  onSubmit,
  onCancel,
  onAddOrganization,
  onNavigateToManageOrgs
}: ProfileFormProps) => {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      headline: "",
      bio: "",
      linkedin_url: "",
      twitter_url: "",
      website_url: "",
      avatar_url: "",
      location_id: "",
      addOrganizationRelationship: undefined,
      navigateToManageOrgs: false
    },
  });

  // Populate form with profile data when available
  useEffect(() => {
    if (profile) {
      form.reset({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        headline: profile.headline || "",
        bio: profile.bio || "",
        linkedin_url: profile.linkedin_url || "",
        twitter_url: profile.twitter_url || "",
        website_url: profile.website_url || "",
        avatar_url: profile.avatar_url || "",
        location_id: profile.location_id || "",
      });
    }
  }, [profile, form]);
  
  // Handle form watch effects in a separate hook
  useFormWatchEffects(form, onAddOrganization, onNavigateToManageOrgs);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <ProfileBasicInfo form={form} />
        <ProfileSocialLinks form={form} />
        <ProfileOrganizationLinks form={form} />
        <ProfileFormActions isSubmitting={isSubmitting} onCancel={onCancel} />
      </form>
    </Form>
  );
};

export default ProfileForm;

// Custom hook to handle form watch effects
function useFormWatchEffects(
  form: ReturnType<typeof useForm<ProfileFormValues>>,
  onAddOrganization?: (data: { 
    organizationId: string; 
    connectionType: "current" | "former" | "connected_insider"; 
    department: string | null; 
    notes: string | null
  }) => void,
  onNavigateToManageOrgs?: () => void
) {
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // If addOrganizationRelationship is set, call the onAddOrganization callback
      if (name === "addOrganizationRelationship" && value.addOrganizationRelationship && onAddOrganization) {
        onAddOrganization({
          organizationId: value.addOrganizationRelationship.organizationId,
          connectionType: value.addOrganizationRelationship.connectionType,
          department: value.addOrganizationRelationship.department,
          notes: value.addOrganizationRelationship.notes
        });
        form.setValue("addOrganizationRelationship", undefined);
      }
      
      // If navigateToManageOrgs is set to true, call the onNavigateToManageOrgs callback
      if (name === "navigateToManageOrgs" && value.navigateToManageOrgs && onNavigateToManageOrgs) {
        onNavigateToManageOrgs();
        form.setValue("navigateToManageOrgs", false);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, onAddOrganization, onNavigateToManageOrgs]);
}
