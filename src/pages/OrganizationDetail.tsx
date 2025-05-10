
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { OrganizationWithLocation, LocationWithDetails, Location } from "@/types";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatLocation } from "@/utils/formatters";
import OrganizationAdmins from "@/components/organizations/OrganizationAdmins";
import { useIsOrganizationAdmin, useOrganizationRole } from "@/hooks/useOrganizationAdmins";
import OrganizationInfo from "@/components/organizations/OrganizationInfo";
import OrganizationAdminAlert from "@/components/organizations/OrganizationAdminAlert";
import { useUserOrganizationRelationships } from "@/hooks/useOrganizations";
import OrganizationDetailHeader from "@/components/organizations/OrganizationDetailHeader";
import PendingAdminRequests from "@/components/organizations/PendingAdminRequests";

const OrganizationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [organization, setOrganization] = useState<OrganizationWithLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: isOrgAdmin = false } = useIsOrganizationAdmin(user?.id, id);
  const { data: userRole } = useOrganizationRole(user?.id, id);
  const isOrgOwner = userRole === "owner";
  
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
      <DashboardLayout>
        <div className="container mx-auto py-6 max-w-3xl">
          <div className="flex justify-center items-center h-64">
            <p>Loading organization...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!organization) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6 max-w-3xl">
          <div className="flex justify-center items-center h-64">
            <p>Organization not found</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4 max-w-3xl">
        <OrganizationDetailHeader 
          userId={user?.id}
          organizationId={id}
          organizationName={organization.name}
          relationships={relationships}
        />

        {/* Admin alert below the header */}
        {user && id && <OrganizationAdminAlert isAdmin={isOrgAdmin} organizationId={id} />}

        <OrganizationInfo organization={organization} />
        
        {/* Show pending admin requests only to organization owners */}
        {isOrgOwner && id && (
          <PendingAdminRequests organizationId={id} />
        )}
        
        {/* Show organization admins */}
        {id && <OrganizationAdmins organizationId={id} />}
      </div>
    </DashboardLayout>
  );
};

export default OrganizationDetail;
