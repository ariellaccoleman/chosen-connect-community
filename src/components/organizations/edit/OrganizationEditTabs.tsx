
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrganizationTags from "@/components/organizations/OrganizationTags";
import { OrganizationBasicInfo } from "./OrganizationBasicInfo";
import { UseFormReturn } from "react-hook-form";
import { OrganizationFormValues } from "./organizationSchema";
import { OrganizationWithLocation } from "@/types";
import { logger } from "@/utils/logger";

interface OrganizationEditTabsProps {
  form?: UseFormReturn<OrganizationFormValues>;
  handleLogoChange?: (url: string) => void;
  orgId: string;
  isOrgAdmin?: boolean;  // Make optional to prevent undefined errors
  organization?: OrganizationWithLocation; // Make optional to prevent undefined errors
}

export function OrganizationEditTabs({ 
  form, 
  handleLogoChange, 
  orgId, 
  isOrgAdmin = false,  // Default value for safety
  organization
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
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-6">
        <TabsTrigger value="basic">Basic Information</TabsTrigger>
        <TabsTrigger value="tags">Tags</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic">
        {form && organization && (
          <OrganizationBasicInfo 
            form={form} 
            handleLogoChange={handleLogoChange}
            organization={organization}
          />
        )}
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
