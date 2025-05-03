
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserOrganizationRelationships } from "@/hooks/useOrganizations";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrganizationCard from "@/components/organizations/OrganizationCard";
import EditRelationshipDialog from "@/components/organizations/EditRelationshipDialog";
import { useState } from "react";
import { OrganizationRelationshipWithDetails } from "@/types";

const ManageOrganizationConnections = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: relationships = [], isLoading: isLoadingRelationships } = useUserOrganizationRelationships(user?.id);
  const [activeTab, setActiveTab] = useState("all");
  const [relationshipToEdit, setRelationshipToEdit] = useState<OrganizationRelationshipWithDetails | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const currentRelationships = relationships.filter(rel => rel.connection_type === 'current');
  const formerRelationships = relationships.filter(rel => rel.connection_type === 'former');
  const allyRelationships = relationships.filter(rel => rel.connection_type === 'ally');

  const handleEditClick = (relationship: OrganizationRelationshipWithDetails) => {
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
            onClick={() => navigate("/organizations")} 
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
            ) : relationships.length > 0 ? (
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="all">
                    All ({relationships.length})
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
                
                <TabsContent value="all" className="space-y-4">
                  {relationships.map(relationship => (
                    <OrganizationCard 
                      key={relationship.id} 
                      relationship={relationship}
                      showActions={true}
                      onEditClick={() => handleEditClick(relationship)}
                    />
                  ))}
                </TabsContent>
                
                <TabsContent value="current" className="space-y-4">
                  {currentRelationships.length > 0 ? (
                    currentRelationships.map(relationship => (
                      <OrganizationCard 
                        key={relationship.id} 
                        relationship={relationship}
                        showActions={true}
                        onEditClick={() => handleEditClick(relationship)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No current organizations
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="former" className="space-y-4">
                  {formerRelationships.length > 0 ? (
                    formerRelationships.map(relationship => (
                      <OrganizationCard 
                        key={relationship.id} 
                        relationship={relationship}
                        showActions={true}
                        onEditClick={() => handleEditClick(relationship)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No former organizations
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="ally" className="space-y-4">
                  {allyRelationships.length > 0 ? (
                    allyRelationships.map(relationship => (
                      <OrganizationCard 
                        key={relationship.id} 
                        relationship={relationship}
                        showActions={true}
                        onEditClick={() => handleEditClick(relationship)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No allied organizations
                    </div>
                  )}
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
