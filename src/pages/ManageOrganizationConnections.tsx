
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserOrganizationRelationships } from "@/hooks/useOrganizations";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EditRelationshipDialog from "@/components/organizations/EditRelationshipDialog";
import { ProfileOrganizationRelationshipWithDetails } from "@/types";
import { formatLocationWithDetails } from "@/utils/adminFormatters";
import OrganizationRelationshipList from "@/components/organizations/OrganizationRelationshipList";

const ManageOrganizationConnections = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: relationships = [], isLoading: isLoadingRelationships } = useUserOrganizationRelationships(user?.id);
  const [activeTab, setActiveTab] = useState("all");
  const [relationshipToEdit, setRelationshipToEdit] = useState<ProfileOrganizationRelationshipWithDetails | null>(null);

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

  const currentRelationships = formattedRelationships.filter(rel => rel.connection_type === 'current');
  const formerRelationships = formattedRelationships.filter(rel => rel.connection_type === 'former');
  const allyRelationships = formattedRelationships.filter(rel => rel.connection_type === 'ally');

  const handleEditClick = (relationship: ProfileOrganizationRelationshipWithDetails) => {
    setRelationshipToEdit(relationship);
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
          <Button 
            onClick={() => navigate("/organizations/new")} 
            className="bg-chosen-blue hover:bg-chosen-navy"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Organization
          </Button>
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
                    Current ({currentRelationships.length})
                  </TabsTrigger>
                  <TabsTrigger value="former">
                    Former ({formerRelationships.length})
                  </TabsTrigger>
                  <TabsTrigger value="ally">
                    Allied ({allyRelationships.length})
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
                
                <TabsContent value="ally">
                  <OrganizationRelationshipList 
                    relationships={allyRelationships}
                    onEditClick={handleEditClick}
                    emptyMessage="No allied organizations"
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
    </DashboardLayout>
  );
};

export default ManageOrganizationConnections;
