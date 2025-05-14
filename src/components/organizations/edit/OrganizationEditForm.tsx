
import { useState } from "react";
import { useUpdateOrganization } from "@/hooks/useOrganizationMutations";
import { OrganizationWithLocation, OrganizationFormValues } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/utils/logger";

interface OrganizationEditFormProps {
  organization: OrganizationWithLocation;
  orgId: string;
  children?: React.ReactNode;
}

const OrganizationEditForm = ({
  organization,
  orgId,
  children
}: OrganizationEditFormProps) => {
  const { toast } = useToast();
  const updateOrganization = useUpdateOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState<OrganizationFormValues>({
    name: organization.name,
    description: organization.description,
    website_url: organization.website_url,
    logo_url: organization.logo_url
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (url: string | null) => {
    setFormValues(prev => ({ ...prev, logo_url: url || undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      logger.info("Submitting organization edit form:", formValues);
      
      await updateOrganization.mutateAsync({
        orgId,
        data: {
          name: formValues.name, // Ensure name is always provided
          description: formValues.description,
          website_url: formValues.website_url,
          logo_url: formValues.logo_url
        }
      });
      
      toast({
        title: "Organization updated successfully",
        description: "Your changes have been saved",
      });
    } catch (error) {
      logger.error("Error updating organization:", error);
      toast({
        title: "Error updating organization",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Render form children (typically tabs) */}
      {children}
    </form>
  );
};

export default OrganizationEditForm;
