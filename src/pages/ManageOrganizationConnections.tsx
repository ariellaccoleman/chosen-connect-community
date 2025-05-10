
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserOrganizationRelationships, useAddOrganizationRelationship } from "@/hooks/useOrganizations";
import { useOrganizations } from "@/hooks/useOrganizationQueries";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EditRelationshipDialog from "@/components/organizations/EditRelationshipDialog";
import { ProfileOrganizationRelationshipWithDetails } from "@/types";
import { toast } from "@/components/ui/sonner";
import OrganizationTabs from "@/components/organizations/OrganizationTabs";
import OrganizationConnectionsHeader from "@/components/organizations/OrganizationConnectionsHeader";
import EmptyOrganizationState from "@/components/organizations/EmptyOrganizationState";
import { formatOrganizationRelationships, filterAvailableOrganizations } from "@/utils/organizationFormatters";

const ManageOrganizationConnections = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: relationships = [], isLoading: isLoadingRelationships } = useUserOrganizationRelationships(user?.id);
  const [activeTab, setActiveTab] = useState("all");
  const [relationshipToEdit, setRelationshipToEdit] = useState<ProfileOrganizationRelationshipWithDetails | null>(null);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  
  // Get organizations for the connect dialog
  const { data: allOrganizations = [], isLoading: isLoadingOrgs } = useOrganizations();
  const addRelationship = useAddOrganizationRelationship();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Use our utility function to format relationships
  const formattedRelationships = formatOrganizationRelationships(relationships);
  
  // Calculate available organizations using our utility function
  const availableOrganizations = filterAvailableOrganizations(allOrganizations, relationships);

  const handleEditClick = (relationship: ProfileOrganizationRelationshipWithDetails) => {
    setRelationshipToEdit(relationship);
  };
  
  const handleAddConnection = async (data: {
    organizationId: string;
    connectionType: "current" | "former" | "connected_insider";
    department: string | null;
    notes: string | null;
  }) => {
    if (!user?.id) return;
    
    try {
      await addRelationship.mutateAsync({
        profile_id: user.id,
        organization_id: data.organizationId,
        connection_type: data.connectionType,
        department: data.department,
        notes: data.notes
      });
      
      toast.success("Organization connection added successfully");
      setIsConnectDialogOpen(false);
    } catch (error) {
      console.error("Error adding organization connection:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-5xl">
        <OrganizationConnectionsHeader
          onConnectClick={() => setIsConnectDialogOpen(true)}
          availableOrganizationsCount={availableOrganizations.length}
        />
        
        <Card>
          <CardHeader>
            <CardTitle>Manage Organization Connections</CardTitle>
            <CardDescription>
              Update or remove your connections to organizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRelationships ? (
              <div className="text-center py-8">Loading your organizations...</div>
            ) : formattedRelationships.length > 0 ? (
              <OrganizationTabs
                relationships={formattedRelationships}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onEditClick={handleEditClick}
              />
            ) : (
              <EmptyOrganizationState />
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Edit Relationship Dialog */}
      {relationshipToEdit && (
        <EditRelationshipDialog 
          relationship={relationshipToEdit}
          isOpen={!!relationshipToEdit}
          onClose={() => setRelationshipToEdit(null)}
        />
      )}
      
      {/* Connect to Organization Dialog */}
      <OrganizationFormDialog
        organizations={availableOrganizations}
        isLoadingOrgs={isLoadingOrgs}
        onClose={() => setIsConnectDialogOpen(false)}
        onSubmit={handleAddConnection}
        isOpen={isConnectDialogOpen}
      />
    </DashboardLayout>
  );
};

export default ManageOrganizationConnections;
