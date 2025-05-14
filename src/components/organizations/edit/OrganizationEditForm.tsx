
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrganizationWithLocation } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { organizationSchema, OrganizationFormValues } from "./organizationSchema";
import { useUpdateOrganization } from "@/hooks/useOrganizationMutations";
import { logger } from "@/utils/logger";

interface OrganizationEditFormProps {
  organization: OrganizationWithLocation;
  orgId: string;
  children: React.ReactNode;
}

export function OrganizationEditForm({ organization, orgId, children }: OrganizationEditFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const updateOrganizationMutation = useUpdateOrganization();

  // Log debugging information
  logger.info("OrganizationEditForm - Rendering with props:", { 
    orgId, 
    organizationName: organization?.name || "undefined"
  });

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization?.name || "",
      description: organization?.description || "",
      website_url: organization?.website_url || "",
      logo_url: organization?.logo_url || "",
    },
  });

  const handleLogoChange = (url: string) => {
    form.setValue("logo_url", url, { shouldValidate: true });
  };

  const onSubmit = async (data: OrganizationFormValues) => {
    if (!orgId) {
      toast({
        title: "Error",
        description: "Invalid organization ID",
        variant: "destructive",
      });
      return;
    }
    
    try {
      logger.info("Submitting organization update:", { id: orgId, data });
      
      await updateOrganizationMutation.mutateAsync({ 
        orgId, 
        data 
      });
      
      toast({
        title: "Success",
        description: "Organization updated successfully",
      });
      
      navigate(`/organizations/${orgId}`);
    } catch (error) {
      logger.error("Error updating organization:", error);
      toast({
        title: "Error",
        description: "Failed to update organization",
        variant: "destructive",
      });
    }
  };

  // Safely clone children to prevent undefined property access errors
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement, { 
        form, 
        handleLogoChange,
        organization 
      });
    }
    return child;
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {childrenWithProps}
    </form>
  );
}
