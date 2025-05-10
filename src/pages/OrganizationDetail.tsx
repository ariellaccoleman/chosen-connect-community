
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { OrganizationWithLocation, LocationWithDetails, Location } from "@/types";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { formatLocation } from "@/utils/formatters";
import OrganizationAdmins from "@/components/organizations/OrganizationAdmins";
import RequestAdminAccessButton from "@/components/organizations/RequestAdminAccessButton";
import { useIsOrganizationAdmin } from "@/hooks/useOrganizationAdmins";
import { useIsMobile } from "@/hooks/use-mobile";
import OrganizationInfo from "@/components/organizations/OrganizationInfo";
import OrganizationAdminAlert from "@/components/organizations/OrganizationAdminAlert";
import { useAddOrganizationRelationship, useUserOrganizationRelationships } from "@/hooks/useOrganizations";
import { toast } from "@/components/ui/sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const OrganizationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [organization, setOrganization] = useState<OrganizationWithLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: isOrgAdmin = false } = useIsOrganizationAdmin(user?.id, id);
  const isMobile = useIsMobile();
  
  // State for the connection dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [connectionType, setConnectionType] = useState<"current" | "former" | "connected_insider">("current");
  
  // Get user's relationships and admin requests
  const { data: relationships = [] } = useUserOrganizationRelationships(user?.id);
  const addRelationship = useAddOrganizationRelationship();
  
  // Check if user has a relationship with this organization
  const hasRelationship = relationships.some(rel => rel.organization_id === id);

  const handleConnectToOrg = async () => {
    if (!user?.id || !id || !organization) return;
    
    try {
      await addRelationship.mutateAsync({
        profile_id: user.id,
        organization_id: id,
        connection_type: connectionType,
        department: null,
        notes: null
      });
      toast.success(`Connected to ${organization.name} as a ${connectionType === "current" ? "current employee" : connectionType === "former" ? "former employee" : "connected insider"}`);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error connecting to organization:", error);
    }
  };

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
            hasRelationship ? (
              <RequestAdminAccessButton 
                organizationId={id} 
                organizationName={organization.name} 
              />
            ) : (
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(true)}
                className="flex gap-2 items-center"
              >
                <Plus className="h-4 w-4" />
                Declare Inside Connection
              </Button>
            )
          )}
        </div>

        <OrganizationAdminAlert isAdmin={isOrgAdmin} organizationId={id} />
        
        {/* Show organization admins */}
        {id && <OrganizationAdmins organizationId={id} />}
      </div>
      
      {/* Connection Type Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Declare Inside Connection</DialogTitle>
            <DialogDescription>
              Select your relationship with {organization?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label htmlFor="connection-type" className="text-sm font-medium">
                Connection Type
              </label>
              <Select value={connectionType} onValueChange={(value) => setConnectionType(value as "current" | "former" | "connected_insider")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select connection type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Employee</SelectItem>
                  <SelectItem value="former">Former Employee</SelectItem>
                  <SelectItem value="connected_insider">Connected Insider</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex space-x-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConnectToOrg}
              disabled={addRelationship.isPending}
            >
              Confirm Connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default OrganizationDetail;
