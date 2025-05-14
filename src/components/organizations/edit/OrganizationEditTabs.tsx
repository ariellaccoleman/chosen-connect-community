
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrganizationTags from "@/components/organizations/OrganizationTags";
import { OrganizationBasicInfo } from "./OrganizationBasicInfo";
import { UseFormReturn } from "react-hook-form";
import { OrganizationFormValues } from "@/types";
import { OrganizationWithLocation } from "@/types";
import { logger } from "@/utils/logger";

export interface OrganizationEditTabsProps {
  form?: UseFormReturn<OrganizationFormValues>;
  handleLogoChange?: (url: string) => void;
  orgId: string;
  isOrgAdmin?: boolean;
  organization?: OrganizationWithLocation;
  isSubmitting?: boolean;
}

export function OrganizationEditTabs({ 
  form, 
  handleLogoChange, 
  orgId, 
  isOrgAdmin = false,
  organization,
  isSubmitting = false
}: OrganizationEditTabsProps) {
  const [activeTab, setActiveTab] = useState("basic");
  
  // Add extensive debug logging for props
  useEffect(() => {
    logger.info("OrganizationEditTabs - Mount with props:", { 
      hasForm: !!form,
      formControlCount: form?.control ? "valid" : "missing",
      orgId, 
      isOrgAdmin,
      hasOrganization: !!organization
    });
    
    return () => {
      logger.info("OrganizationEditTabs - Unmounting");
    };
  }, [form, organization, orgId, isOrgAdmin]);
  
  // Safety checks to prevent rendering with invalid data
  if (!form) {
    logger.warn("OrganizationEditTabs - Missing required form prop");
    return <div className="p-4 text-red-500">Error: Form data is missing</div>;
  }
  
  if (!organization) {
    logger.warn("OrganizationEditTabs - Missing required organization data");
    return <div className="p-4 text-red-500">Error: Organization data is missing</div>;
  }
  
  // More detailed logging of what's actually in the form object
  logger.debug("OrganizationEditTabs - Form object contents:", { 
    hasControl: !!form.control,
    hasWatch: !!form.watch,
    hasHandleSubmit: !!form.handleSubmit,
    formState: form.formState ? "exists" : "missing"
  });
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-6">
        <TabsTrigger value="basic">Basic Information</TabsTrigger>
        <TabsTrigger value="tags">Tags</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic">
        <OrganizationBasicInfo 
          form={form} 
          handleLogoChange={handleLogoChange}
          organization={organization}
          isSubmitting={isSubmitting}
        />
      </TabsContent>
      
      <TabsContent value="tags">
        {orgId && (
          <OrganizationTags
            organizationId={orgId}
            isAdmin={!!isOrgAdmin}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
