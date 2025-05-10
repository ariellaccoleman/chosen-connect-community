
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserOrganizationRelationships, useAddOrganizationRelationship } from "@/hooks/useOrganizations";
import { useOrganizations } from "@/hooks/useOrganizationQueries";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Link2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EditRelationshipDialog from "@/components/organizations/EditRelationshipDialog";
import { ProfileOrganizationRelationshipWithDetails } from "@/types";
import { formatLocationWithDetails } from "@/utils/adminFormatters";
import OrganizationRelationshipList from "@/components/organizations/OrganizationRelationshipList";
import OrganizationFormDialog from "@/components/profile/organization/OrganizationFormDialog";
import { toast } from "@/components/ui/sonner";

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

  // Format relationships to ensure they have the correct type structure
  const formattedRelationships: ProfileOrganizationRelationshipWithDetails[] = relationships.map(rel => {
    // Ensure the organization location has the formatted_location field
    const organization = {
      ...rel.organization,
      location: rel.organization.location 
        ? formatLocationWithDetails(rel.organization.location) 
        : undefined
    };
    
    return {
      ...rel,
      organization
    };
  });

  // Calculate available organizations (ones user is not already connected to)
  const availableOrganizations = allOrganizations.filter(
    org => !relationships.some(rel => rel.organization_id === org.id)
  );

  const currentRelationships = formattedRelationships.filter(rel => rel.connection_type === 'current');
  const formerRelationships = formattedRelationships.filter(rel => rel.connection_type === 'former');
  const connectedInsiderRelationships = formattedRelationships.filter(rel => rel.connection_type === 'connected_insider');

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
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold font-heading">Your Organizations</h1>
          <div className="flex space-x-2">
            <Button 
              onClick={() => setIsConnectDialogOpen(true)} 
              className="bg-chosen-blue hover:bg-chosen-navy"
              disabled={availableOrganizations.length === 0}
            >
              <Link2 className="mr-2 h-4 w-4" />
              Connect to Org
            </Button>
            <Button 
              onClick={() => navigate("/organizations/new")} 
              className="bg-chosen-blue hover:bg-chosen-navy"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Organization
            </Button>
          </div>
        </div>
        
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
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="all">
                    All ({formattedRelationships.length})
                  </TabsTrigger>
                  <TabsTrigger value="current">
                    Current Employees ({currentRelationships.length})
                  </TabsTrigger>
                  <TabsTrigger value="former">
                    Former Employees ({formerRelationships.length})
                  </TabsTrigger>
                  <TabsTrigger value="connected_insider">
                    Connected Insiders ({connectedInsiderRelationships.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <OrganizationRelationshipList 
                    relationships={formattedRelationships}
                    onEditClick={handleEditClick}
                    emptyMessage="No organizations"
                  />
                </TabsContent>
                
                <TabsContent value="current">
                  <OrganizationRelationshipList 
                    relationships={currentRelationships}
                    onEditClick={handleEditClick}
                    emptyMessage="No current organizations"
                  />
                </TabsContent>
                
                <TabsContent value="former">
                  <OrganizationRelationshipList 
                    relationships={formerRelationships}
                    onEditClick={handleEditClick}
                    emptyMessage="No former organizations"
                  />
                </TabsContent>
                
                <TabsContent value="connected_insider">
                  <OrganizationRelationshipList 
                    relationships={connectedInsiderRelationships}
                    onEditClick={handleEditClick}
                    emptyMessage="No connected insider organizations"
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You haven't added any organizations yet</p>
                <Button 
                  onClick={() => navigate("/organizations")}
                  className="bg-chosen-blue hover:bg-chosen-navy"
                >
                  Browse Organizations
                </Button>
              </div>
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
