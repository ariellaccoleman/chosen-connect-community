
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { OrganizationWithLocation, LocationWithDetails, Location } from "@/types";
import { formatLocation } from "@/utils/formatters/locationFormatters";
import OrganizationAdmins from "@/components/organizations/OrganizationAdmins";
import { useIsOrganizationAdmin, useOrganizationRole } from "@/hooks/useOrganizationAdmins";
import OrganizationInfo from "@/components/organizations/OrganizationInfo";
import OrganizationAdminAlert from "@/components/organizations/OrganizationAdminAlert";
import { useUserOrganizationRelationships } from "@/hooks/useOrganizationQueries";
import OrganizationDetailHeader from "@/components/organizations/OrganizationDetailHeader";
import EntityTagManager from "@/components/tags/EntityTagManager";
import { Card, CardContent } from "@/components/ui/card";
import OrganizationMembers from "@/components/organizations/OrganizationMembers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityType } from "@/types/entityTypes";
import { logger } from "@/utils/logger";

const OrganizationDetail = () => {
  // Changed from 'id' to 'orgId' to match the route parameter name
  const { id: orgId } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const [organization, setOrganization] = useState<OrganizationWithLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  
  // Update all useIsOrganizationAdmin calls with the correct ID
  const { data: isOrgAdmin = false } = useIsOrganizationAdmin(user?.id, orgId);
  const { data: userRole } = useOrganizationRole(user?.id, orgId);
  
  // Get user's relationships with the fixed hook usage
  const { data: relationshipsResponse } = useUserOrganizationRelationships(user?.id);
  const relationships = relationshipsResponse?.data || [];

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!orgId) {
        logger.error("OrganizationDetail - No organization ID in URL params");
        setLoading(false);
        return;
      }

      try {
        logger.info(`OrganizationDetail - Fetching organization with ID: ${orgId}`);
        setLoading(true);
        const { data, error } = await supabase
          .from("organizations")
          .select(`
            *,
            location:locations(*)
          `)
          .eq("id", orgId)
          .single();

        if (error) {
          logger.error(`OrganizationDetail - Error fetching organization: ${error.message}`);
          throw error;
        }

        // Format the location
        const organizationWithLocation: OrganizationWithLocation = {
          ...data,
          location: undefined
        };

        if (data && data.location) {
          const locationData = data.location as Location;
          const locationWithDetails: LocationWithDetails = {
            ...locationData,
            formatted_location: formatLocation(locationData)
          };
          organizationWithLocation.location = locationWithDetails;
        }

        logger.info(`OrganizationDetail - Successfully fetched organization: ${data.name}`);
        setOrganization(organizationWithLocation);
      } catch (error) {
        logger.error("Error fetching organization:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [orgId]);

  if (loading) {
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
