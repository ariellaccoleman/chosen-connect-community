
import React, { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { OrganizationFormValues } from "@/types";
import FormInput from "@/components/common/form/FormInput";
import FormTextarea from "@/components/common/form/FormTextarea";
import LogoUpload from "@/components/organizations/LogoUpload";
import { Button } from "@/components/ui/button";
import { OrganizationWithLocation } from "@/types";
import { logger } from "@/utils/logger";
import { Save } from "lucide-react";

export interface OrganizationBasicInfoProps {
  form: UseFormReturn<OrganizationFormValues>;
  handleLogoChange?: (url: string) => void;
  organization: OrganizationWithLocation;
  isSubmitting?: boolean;
}

export function OrganizationBasicInfo({ 
  form, 
  handleLogoChange,
  organization,
  isSubmitting = false
}: OrganizationBasicInfoProps) {
  // Enhanced logging for debugging
  useEffect(() => {
    logger.info("OrganizationBasicInfo - Component mounted with props:", {
      hasForm: !!form,
      formControlExists: !!form?.control,
      organizationName: organization?.name || "missing",
      isSubmitting
    });
    
    return () => {
      logger.info("OrganizationBasicInfo - Component unmounting");
    };
  }, [form, organization, isSubmitting]);

  // Check if we have form values and provide fallbacks
  const logoUrl = form?.watch?.("logo_url") || organization?.logo_url || "";
  const orgName = form?.watch?.("name") || organization?.name || "";
  
  // Extra safety check for form
  if (!form || !form.control) {
    logger.error("OrganizationBasicInfo - Invalid form object:", { 
      formExists: !!form,
      formKeys: form ? Object.keys(form).join(', ') : "N/A",
      controlExists: !!form?.control
    });
    return <div className="text-red-500 p-4">Error: Form controller is missing</div>;
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium">Organization Logo</label>
        <LogoUpload
          logoUrl={logoUrl}
          organizationName={orgName}
          onLogoChange={(url) => handleLogoChange && handleLogoChange(url)}
        />
      </div>

      <FormInput
        name="name"
        control={form.control}
        label="Organization Name"
        required
      />

      <FormTextarea
        name="description"
        control={form.control}
        label="Description"
        placeholder="Describe the organization"
        description="Provide details about what the organization does."
        rows={4}
      />

      <FormInput
        name="website_url"
        control={form.control}
        label="Website URL"
        placeholder="https://example.org"
        type="url"
        description="The organization's website address."
      />

      {/* Location is displayed but not editable in this version */}
      {organization?.location && (
        <div className="mt-4">
          <p className="text-sm font-medium">Location</p>
          <p className="text-sm text-muted-foreground">
            {organization.location.formatted_location}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Location editing is not available in this version.
          </p>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button type="submit" className="ml-auto" disabled={isSubmitting}>
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
