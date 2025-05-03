
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ProfileWithDetails } from "@/types";
import ProfileBasicInfo from "./ProfileBasicInfo";
import ProfileSocialLinks from "./ProfileSocialLinks";
import ProfileOrganizationLinks from "./ProfileOrganizationLinks";

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  headline: z.string().optional(),
  bio: z.string().optional(),
  linkedin_url: z.string().url("Must be a valid URL").optional().or(z.string().length(0)),
  twitter_url: z.string().url("Must be a valid URL").optional().or(z.string().length(0)),
  website_url: z.string().url("Must be a valid URL").optional().or(z.string().length(0)),
  avatar_url: z.string().optional(),
  location_id: z.string().optional(),
  // These fields are used for special actions, not actual profile data
  addOrganizationRelationship: z.object({
    organizationId: z.string(),
    connectionType: z.enum(["current", "former", "ally"]),
    department: z.string().nullable(),
    notes: z.string().nullable()
  }).optional(),
  navigateToManageOrgs: z.boolean().optional()
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  profile: ProfileWithDetails | null;
  isSubmitting: boolean;
  onSubmit: (data: ProfileFormValues) => void;
  onCancel: () => void;
  onAddOrganization?: (data: { 
    organizationId: string; 
    connectionType: "current" | "former" | "ally"; 
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
  
  // Handle special form actions
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // If addOrganizationRelationship is set, call the onAddOrganization callback
      if (name === "addOrganizationRelationship" && value.addOrganizationRelationship && onAddOrganization) {
        onAddOrganization(value.addOrganizationRelationship);
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <ProfileBasicInfo form={form} />
        <ProfileSocialLinks form={form} />
        <ProfileOrganizationLinks form={form} />
        
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-chosen-blue hover:bg-chosen-navy"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProfileForm;
