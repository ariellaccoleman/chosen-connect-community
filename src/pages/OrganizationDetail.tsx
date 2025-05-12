
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
import { useUserOrganizationRelationships } from "@/hooks/useOrganizations";
import OrganizationDetailHeader from "@/components/organizations/OrganizationDetailHeader";
import EntityTagManager from "@/components/tags/EntityTagManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import OrganizationMembers from "@/components/organizations/OrganizationMembers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const OrganizationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const [organization, setOrganization] = useState<OrganizationWithLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const { data: isOrgAdmin = false } = useIsOrganizationAdmin(user?.id, id);
  const { data: userRole } = useOrganizationRole(user?.id, id);
  
  // Get user's relationships
  const { data: relationships = [] } = useUserOrganizationRelationships(user?.id);

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("organizations")
          .select(`
            *,
            location:locations(*)
          `)
          .eq("id", id)
          .single();

        if (error) {
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

        setOrganization(organizationWithLocation);
      } catch (error) {
        console.error("Error fetching organization:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [id]);

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
        organizationId={id}
        organizationName={organization.name}
        relationships={relationships}
      />

      {/* Admin alert below the header */}
      {user && id && <OrganizationAdminAlert isAdmin={isOrgAdmin} organizationId={id} />}

      <div className="space-y-6">
        {/* Organization Info Card with Tags */}
        <Card>
          <CardContent className="pt-6">
            <OrganizationInfo organization={organization} />
            
            {/* Tags Section */}
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-medium mb-2">Tags</h3>
              <div className="mt-2">
                {id && (
                  <EntityTagManager 
                    entityId={id} 
                    entityType="organization" 
                    isAdmin={isOrgAdmin || isAdmin}
                    showEntityType={false}
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
            {id && <OrganizationMembers organizationId={id} />}
          </TabsContent>
          
          {(isOrgAdmin || isAdmin) && (
            <TabsContent value="admins">
              {id && <OrganizationAdmins organizationId={id} />}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default OrganizationDetail;
