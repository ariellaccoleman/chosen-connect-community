
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import OrganizationCard from "@/components/organizations/OrganizationCard";
import { Briefcase } from "lucide-react";
import { ProfileOrganizationRelationshipWithDetails } from "@/types";
import EditRelationshipDialog from "@/components/organizations/EditRelationshipDialog";

interface OrganizationSectionProps {
  relationships: ProfileOrganizationRelationshipWithDetails[];
  isLoading: boolean;
}

const OrganizationSection = ({ relationships, isLoading }: OrganizationSectionProps) => {
  const navigate = useNavigate();
  const [selectedRelationship, setSelectedRelationship] = useState<ProfileOrganizationRelationshipWithDetails | null>(null);
  
  const handleEditRelationship = (relationship: ProfileOrganizationRelationshipWithDetails) => {
    setSelectedRelationship(relationship);
  };

  const handleCloseDialog = () => {
    setSelectedRelationship(null);
  };
  
  // Group organizations by connection type
  const currentOrgs = relationships.filter(rel => rel.connection_type === 'current');
  const formerOrgs = relationships.filter(rel => rel.connection_type === 'former');
  const connectedInsiderOrgs = relationships.filter(rel => rel.connection_type === 'connected_insider');
  
  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle>Your Organizations</CardTitle>
            <Button 
              onClick={() => navigate("/organizations/manage")} 
              className="bg-chosen-blue hover:bg-chosen-navy w-full sm:w-auto"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Manage Organizations
            </Button>
          </div>
          <CardDescription>
            Organizations you're connected with
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading organizations...</p>
          ) : relationships.length > 0 ? (
            <div className="space-y-6">
              {currentOrgs.length > 0 && (
                <OrganizationGroup 
                  title="Current Employee"
                  relationships={currentOrgs} 
                  onEditClick={handleEditRelationship} 
                />
              )}
              
              {formerOrgs.length > 0 && (
                <OrganizationGroup 
                  title="Former Employee"
                  relationships={formerOrgs} 
                  onEditClick={handleEditRelationship} 
                />
              )}
              
              {connectedInsiderOrgs.length > 0 && (
                <OrganizationGroup 
                  title="Connected Insider"
                  relationships={connectedInsiderOrgs} 
                  onEditClick={handleEditRelationship} 
                />
              )}
            </div>
          ) : (
            <div className="text-center py-6">
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
      
      {/* Edit Relationship Dialog */}
      {selectedRelationship && (
        <EditRelationshipDialog
          relationship={selectedRelationship}
          isOpen={!!selectedRelationship}
          onClose={handleCloseDialog}
        />
      )}
    </>
  );
};

// Sub-component for organization groups
interface OrganizationGroupProps {
  title: string;
  relationships: ProfileOrganizationRelationshipWithDetails[];
  onEditClick: (relationship: ProfileOrganizationRelationshipWithDetails) => void;
}

const OrganizationGroup = ({ title, relationships, onEditClick }: OrganizationGroupProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {relationships.map(relationship => (
          <OrganizationCard 
            key={relationship.id} 
            relationship={relationship} 
            onEditClick={() => onEditClick(relationship)}
          />
        ))}
      </div>
    </div>
  );
};

export default OrganizationSection;
