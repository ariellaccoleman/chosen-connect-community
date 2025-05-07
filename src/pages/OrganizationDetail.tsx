
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { OrganizationWithLocation, LocationWithDetails, Location } from "@/types";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { formatLocation } from "@/utils/formatters";
import OrganizationAdmins from "@/components/organizations/OrganizationAdmins";
import RequestAdminAccessButton from "@/components/organizations/RequestAdminAccessButton";
import { useIsOrganizationAdmin } from "@/hooks/useOrganizationAdmins";
import { useIsMobile } from "@/hooks/use-mobile";
import OrganizationInfo from "@/components/organizations/OrganizationInfo";
import OrganizationAdminAlert from "@/components/organizations/OrganizationAdminAlert";

const OrganizationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [organization, setOrganization] = useState<OrganizationWithLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: isOrgAdmin = false } = useIsOrganizationAdmin(user?.id, id);
  const isMobile = useIsMobile();

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
        <Button variant="ghost" onClick={() => navigate("/organizations")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Organizations
        </Button>

        <OrganizationInfo organization={organization} />
        
        <div className="flex justify-end mt-4 mb-6">
          {user && id && (
            <RequestAdminAccessButton 
              organizationId={id} 
              organizationName={organization.name} 
            />
          )}
        </div>

        <OrganizationAdminAlert isAdmin={isOrgAdmin} organizationId={id} />
        
        {/* Show organization admins */}
        {id && <OrganizationAdmins organizationId={id} />}
      </div>
    </DashboardLayout>
  );
};

export default OrganizationDetail;
