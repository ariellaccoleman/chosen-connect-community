
import React, { useState, ReactElement } from "react";
import { useForm } from "react-hook-form";
import { useUpdateOrganization } from "@/hooks/useOrganizationMutations";
import { OrganizationWithLocation, OrganizationFormValues } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/utils/logger";

// Define the props that can be passed to children
interface OrganizationFormChildProps {
  form: ReturnType<typeof useForm<OrganizationFormValues>>;
  handleLogoChange: (url: string) => void;
  organization: OrganizationWithLocation;
  isSubmitting: boolean;
}

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

  // Helper function to properly type-check when cloning elements
  const enhanceChild = (child: React.ReactNode, index?: number): React.ReactNode => {
    // Skip non-element nodes
    if (!React.isValidElement(child)) return child;

    // Clone with proper typing
    return React.cloneElement(
      child as ReactElement<Partial<OrganizationFormChildProps>>, 
      { 
        key: index, 
        form,
        handleLogoChange,
        organization,
        isSubmitting
      }
    );
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Clone children and pass form props with proper typing */}
      {children && Array.isArray(children) ? (
        children.map((child, index) => enhanceChild(child, index))
      ) : (
        enhanceChild(children)
      )}
    </form>
  );
}
