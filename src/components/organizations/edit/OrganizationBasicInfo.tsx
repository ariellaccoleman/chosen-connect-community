
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { OrganizationFormValues } from "./organizationSchema";
import { FormWrapper } from "@/components/common/form/FormWrapper";
import FormInput from "@/components/common/form/FormInput";
import FormTextarea from "@/components/common/form/FormTextarea";
import LogoUpload from "@/components/organizations/LogoUpload";
import FormActions from "@/components/common/form/FormActions";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrganizationWithLocation } from "@/types";
import { logger } from "@/utils/logger";

interface OrganizationBasicInfoProps {
  form: UseFormReturn<OrganizationFormValues>;
  handleLogoChange?: (url: string) => void;
  organization: OrganizationWithLocation;
}

export function OrganizationBasicInfo({ 
  form, 
  handleLogoChange,
  organization 
}: OrganizationBasicInfoProps) {
  // Log for debugging
  logger.info("OrganizationBasicInfo - Rendering with organization:", {
    name: organization?.name || "undefined"
  });

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium">Organization Logo</label>
        <LogoUpload
          logoUrl={form.watch("logo_url") || ""}
          organizationName={form.watch("name")}
          onLogoChange={handleLogoChange || (() => {})} // Provide fallback empty function
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
        <Button type="submit" className="ml-auto">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
