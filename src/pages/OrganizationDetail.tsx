
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { OrganizationWithLocation, LocationWithDetails } from "@/types";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building, Link as LinkIcon, MapPin, ShieldCheck } from "lucide-react";
import { formatLocation, formatWebsiteUrl } from "@/utils/formatters";
import OrganizationAdmins from "@/components/organizations/OrganizationAdmins";
import RequestAdminAccessButton from "@/components/organizations/RequestAdminAccessButton";
import { useIsOrganizationAdmin } from "@/hooks/useOrganizationAdmins";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";

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
        if (data && data.location) {
          const locationWithDetails: LocationWithDetails = {
            ...data.location,
            formatted_location: formatLocation(data.location)
          };
          data.location = locationWithDetails;
        }

        setOrganization(data);
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

        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              {organization.logo_url ? (
                <img
                  src={organization.logo_url}
                  alt={organization.name}
                  className="h-16 w-16 rounded-md object-contain bg-gray-50"
                />
              ) : (
                <div className="h-16 w-16 rounded-md bg-gray-100 flex items-center justify-center">
                  <Building className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{organization.name}</h1>
                {organization.location && organization.location.formatted_location && (
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {organization.location.formatted_location}
                  </div>
                )}
              </div>
            </div>
            
            {user && id && (
              <div className="flex justify-end">
                <RequestAdminAccessButton 
                  organizationId={id} 
                  organizationName={organization.name} 
                />
              </div>
            )}
          </div>

          {isOrgAdmin && (
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              <AlertTitle>Organization Admin</AlertTitle>
              <AlertDescription>
                You have admin access to this organization.
                <Button variant="link" className="p-0 h-auto text-blue-600 pl-1">
                  Edit Organization Details
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {organization.description && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">About</h2>
              <p className="text-gray-700">{organization.description}</p>
            </div>
          )}

          {organization.website_url && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Website</h2>
              <a
                href={formatWebsiteUrl(organization.website_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center break-all"
              >
                <LinkIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                {organization.website_url}
              </a>
            </div>
          )}
        </div>
        
        {/* Show organization admins */}
        {id && <OrganizationAdmins organizationId={id} />}
      </div>
    </DashboardLayout>
  );
};

// Helper function to format website URLs
const formatWebsiteUrl = (url: string): string => {
  if (!url) return '';
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
};

export default OrganizationDetail;
