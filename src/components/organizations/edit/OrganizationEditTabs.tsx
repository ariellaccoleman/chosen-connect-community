
import React, { useState } from "react";
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
  
  // Add debug logging
  logger.info("OrganizationEditTabs - Rendering with props:", { 
    hasForm: !!form,
    orgId, 
    isOrgAdmin,
    hasOrganization: !!organization,
    organizationName: organization?.name || "undefined"
  });
  
  // Safety checks to prevent rendering with invalid data
  if (!form || !organization) {
    logger.warn("OrganizationEditTabs - Missing required props:", { 
      hasForm: !!form, 
      hasOrganization: !!organization 
    });
    return null;
  }
  
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
