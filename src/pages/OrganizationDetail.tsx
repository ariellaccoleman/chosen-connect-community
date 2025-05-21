
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { OrganizationWithLocation } from "@/types";
import OrganizationAdmins from "@/components/organizations/OrganizationAdmins";
import { useIsOrganizationAdmin, useOrganizationRole } from "@/hooks/organizations";
import OrganizationInfo from "@/components/organizations/OrganizationInfo";
import OrganizationAdminAlert from "@/components/organizations/OrganizationAdminAlert";
import { useUserOrganizationRelationships, useOrganization } from "@/hooks/organizations";
import OrganizationDetailHeader from "@/components/organizations/OrganizationDetailHeader";
import EntityTagManager from "@/components/tags/EntityTagManager";
import { Card, CardContent } from "@/components/ui/card";
import OrganizationMembers from "@/components/organizations/OrganizationMembers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";

const OrganizationDetail = () => {
  // Use orgId parameter to match the route defined in APP_ROUTES.ORGANIZATION_DETAIL
  const { orgId } = useParams<{ orgId: string }>();
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("members");
  
  // Pass the correct id to the useOrganization hook
  const { data: organizationResponse, isLoading } = useOrganization(orgId);
  const organization = organizationResponse?.data as OrganizationWithLocation;
  
  // Update all useIsOrganizationAdmin calls with the correct ID
  const { data: isOrgAdmin = false } = useIsOrganizationAdmin(user?.id, orgId);
  const { data: userRole } = useOrganizationRole(user?.id, orgId);
  
  // Get user's relationships with the fixed hook usage
  const { data: relationshipsResponse } = useUserOrganizationRelationships(user?.id);
  const relationships = relationshipsResponse?.data || [];

  // Log organization data for debugging
  useEffect(() => {
    if (organization) {
      logger.info(`OrganizationDetail - Successfully loaded organization: ${organization.name}`);
    } else if (!isLoading && orgId) {
      logger.warn(`OrganizationDetail - No organization found with ID: ${orgId}`);
    }
  }, [organization, isLoading, orgId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-3xl">
        <div className="flex justify-center items-center h-64">
          <p>Loading organization...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="container mx-auto py-6 max-w-3xl">
        <div className="flex justify-center items-center h-64">
          <p>Organization not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-3xl">
      <OrganizationDetailHeader 
        userId={user?.id}
        organizationId={orgId}
        organizationName={organization?.name}
        relationships={relationships}
      />

      {/* Admin alert below the header */}
      {user && orgId && <OrganizationAdminAlert isAdmin={isOrgAdmin} organizationId={orgId} />}

      <div className="space-y-6">
        {/* Organization Info Card with Tags */}
        <Card>
          <CardContent className="pt-6">
            <OrganizationInfo organization={organization} />
            
            {/* Tags Section */}
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-medium mb-2">Tags</h3>
              <div className="mt-2">
                {orgId && (
                  <EntityTagManager 
                    entityId={orgId} 
                    entityType={EntityType.ORGANIZATION} 
                    isAdmin={isOrgAdmin || isAdmin}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Members and Admin (if admin) */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="members">Members</TabsTrigger>
            {(isOrgAdmin || isAdmin) && (
              <TabsTrigger value="admins">Admins</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="members">
            {orgId && <OrganizationMembers organizationId={orgId} />}
          </TabsContent>
          
          {(isOrgAdmin || isAdmin) && (
            <TabsContent value="admins">
              {orgId && <OrganizationAdmins organizationId={orgId} />}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default OrganizationDetail;
