
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useUpdateOrganization } from "@/hooks/useOrganizationMutations";
import { OrganizationWithLocation, OrganizationFormValues } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/utils/logger";

interface OrganizationEditFormProps {
  organization: OrganizationWithLocation;
  orgId: string;
  children?: React.ReactNode;
}

export function OrganizationEditForm({
  organization,
  orgId,
  children
}: OrganizationEditFormProps) {
  const { toast } = useToast();
  const updateOrganization = useUpdateOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize react-hook-form with the organization data
  const form = useForm<OrganizationFormValues>({
    defaultValues: {
      name: organization.name,
      description: organization.description || "",
      website_url: organization.website_url || "",
      logo_url: organization.logo_url || ""
    }
  });

  const handleLogoChange = (url: string) => {
    form.setValue("logo_url", url);
  };

  const onSubmit = async (values: OrganizationFormValues) => {
    try {
      setIsSubmitting(true);
      
      logger.info("Submitting organization edit form:", values);
      
      await updateOrganization.mutateAsync({
        orgId,
        data: {
          name: values.name, 
          description: values.description,
          website_url: values.website_url,
          logo_url: values.logo_url
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
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Clone children and pass form props */}
      {children && Array.isArray(children) ? (
        children.map((child, index) => {
          if (!React.isValidElement(child)) return child;
          return React.cloneElement(child, { 
            key: index,
            form,
            handleLogoChange,
            organization,
            isSubmitting
          });
        })
      ) : children && React.isValidElement(children) ? (
        React.cloneElement(children, { 
          form,
          handleLogoChange,
          organization,
          isSubmitting
        })
      ) : null}
    </form>
  );
}
