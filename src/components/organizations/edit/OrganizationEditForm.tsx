
import React, { useState, ReactElement, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useUpdateOrganization } from "@/hooks/organizations";
import { OrganizationWithLocation, OrganizationFormValues } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { zodResolver } from "@hookform/resolvers/zod";
import { organizationSchema } from "./organizationSchema";
import { FormWrapper } from "@/components/common/form/FormWrapper";

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
  
  // Log props received
  useEffect(() => {
    logger.info("OrganizationEditForm - Mounted with props:", {
      orgId,
      organizationName: organization?.name || "missing",
      hasChildren: !!children
    });
  }, [orgId, organization, children]);
  
  // Initialize react-hook-form with the organization data and zod resolver
  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization?.name || "",
      description: organization?.description || "",
      website_url: organization?.website_url || "",
      logo_url: organization?.logo_url || ""
    }
  });

  // Log form initialization
  useEffect(() => {
    logger.info("OrganizationEditForm - Form initialized", {
      formControl: form.control ? "valid" : "missing",
      formMethods: Object.keys(form).join(", ")
    });
  }, [form]);

  const handleLogoChange = (url: string) => {
    if (form && form.setValue) {
      form.setValue("logo_url", url);
      logger.info("Logo URL updated", { url });
    } else {
      logger.error("Cannot update logo URL, form or setValue is undefined");
    }
  };

  const onSubmit = async (values: OrganizationFormValues) => {
    try {
      setIsSubmitting(true);
      
      logger.info("Submitting organization edit form:", values);
      
      await updateOrganization.mutateAsync({
        id: orgId,
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

  // Helper function to safely clone children with additional props
  const enhanceChild = (child: React.ReactNode, index?: number): React.ReactNode => {
    // Skip non-element nodes (strings, null, etc.)
    if (!React.isValidElement(child)) {
      logger.debug("Skipping non-element child:", { childType: typeof child });
      return child;
    }

    try {
      // Log cloning information
      logger.debug("Cloning element:", {
        elementType: (child.type as any)?.name || typeof child.type,
        hasProps: !!child.props,
        childProps: Object.keys(child.props || {}).join(', ')
      });

      // Clone with proper typing and wrap in try-catch
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
    } catch (err) {
      logger.error("Error cloning element:", err);
      return <div className="text-red-500 p-2">Error rendering component</div>;
    }
  };

  if (!organization) {
    logger.warn("OrganizationEditForm - No organization data provided");
    return <div className="text-red-500 p-4">Error: Missing organization data</div>;
  }

  return (
    <FormWrapper 
      form={form} 
      onSubmit={onSubmit} 
      id={`org-edit-${orgId}`}
    >
      {children && Array.isArray(children) ? (
        // Handle array of children
        children.map((child, index) => enhanceChild(child, index))
      ) : (
        // Handle single child
        enhanceChild(children)
      )}
    </FormWrapper>
  );
}
