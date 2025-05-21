
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, Building } from "lucide-react";
import { ProfileOrganizationRelationshipWithDetails } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import DeleteRelationshipDialog from "@/components/organizations/DeleteRelationshipDialog";
import { useIsOrganizationAdmin } from "@/hooks/organizations";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import EditRelationshipDialog from "@/components/organizations/EditRelationshipDialog";

interface OrganizationRelationshipListProps {
  relationships: ProfileOrganizationRelationshipWithDetails[];
  isLoading?: boolean;
  onEditClick?: (relationship: ProfileOrganizationRelationshipWithDetails) => void;
  emptyMessage?: string;
}

const OrganizationRelationshipList = ({ 
  relationships, 
  isLoading = false,
  onEditClick,
  emptyMessage = "No organization connections"
}: OrganizationRelationshipListProps) => {
  const [selectedForDelete, setSelectedForDelete] = useState<ProfileOrganizationRelationshipWithDetails | null>(null);
  const [selectedForEdit, setSelectedForEdit] = useState<ProfileOrganizationRelationshipWithDetails | null>(null);
  
  const handleEditClick = (relationship: ProfileOrganizationRelationshipWithDetails) => {
    if (onEditClick) {
      onEditClick(relationship);
    } else {
      setSelectedForEdit(relationship);
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-md p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64 mt-2" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (relationships.length === 0) {
    return (
      <div className="text-center py-12">
        <Building className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium">No organization connections</h3>
        <p className="mt-2 text-gray-500">
          {emptyMessage}
        </p>
      </div>
    );
  }
  
  // Group relationships by connection type
  const currentOrgs = relationships.filter(rel => rel.connection_type === 'current');
  const formerOrgs = relationships.filter(rel => rel.connection_type === 'former');
  const connectedInsiderOrgs = relationships.filter(rel => rel.connection_type === 'connected_insider');
  
  return (
    <div className="space-y-8">
      {currentOrgs.length > 0 && (
        <OrganizationGroup 
          title="Current" 
          relationships={currentOrgs}
          onEdit={handleEditClick}
          onDelete={setSelectedForDelete}
        />
      )}
      
      {formerOrgs.length > 0 && (
        <OrganizationGroup 
          title="Former" 
          relationships={formerOrgs}
          onEdit={handleEditClick}
          onDelete={setSelectedForDelete}
        />
      )}
      
      {connectedInsiderOrgs.length > 0 && (
        <OrganizationGroup 
          title="Connected Insider" 
          relationships={connectedInsiderOrgs}
          onEdit={handleEditClick}
          onDelete={setSelectedForDelete}
        />
      )}
      
      {/* Dialogs */}
      {selectedForEdit && (
        <EditRelationshipDialog
          relationship={selectedForEdit}
          isOpen={!!selectedForEdit}
          onClose={() => setSelectedForEdit(null)}
        />
      )}
      
      {selectedForDelete && (
        <DeleteRelationshipDialog
          organizationName={selectedForDelete.organization?.name}
          relationshipId={selectedForDelete.id}
          onDeleteSuccess={() => setSelectedForDelete(null)}
        />
      )}
    </div>
  );
};

interface OrganizationGroupProps {
  title: string;
  relationships: ProfileOrganizationRelationshipWithDetails[];
  onEdit: (rel: ProfileOrganizationRelationshipWithDetails) => void;
  onDelete: (rel: ProfileOrganizationRelationshipWithDetails) => void;
}

const OrganizationGroup = ({ 
  title, 
  relationships,
  onEdit,
  onDelete
}: OrganizationGroupProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{title} Organizations</h3>
      <div className="space-y-4">
        {relationships.map((relationship) => (
          <RelationshipItem 
            key={relationship.id} 
            relationship={relationship}
            onEdit={() => onEdit(relationship)}
            onDelete={() => onDelete(relationship)}
          />
        ))}
      </div>
    </div>
  );
};

interface RelationshipItemProps {
  relationship: ProfileOrganizationRelationshipWithDetails;
  onEdit: () => void;
  onDelete: () => void;
}

const RelationshipItem = ({ relationship, onEdit, onDelete }: RelationshipItemProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const org = relationship.organization;
  
  const { data: isAdmin = false } = useIsOrganizationAdmin(
    user?.id || '',
    org?.id || ''
  );
  
  if (!org) return null;
  
  return (
    <div className="border rounded-md p-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-lg">{org.name}</h4>
            {isAdmin && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Admin
              </Badge>
            )}
          </div>
          
          {relationship.department && (
            <p className="text-gray-600">{relationship.department}</p>
          )}
          
          {relationship.notes && (
            <p className="text-gray-600 mt-2">{relationship.notes}</p>
          )}
          
          {org.location?.formatted_location && (
            <p className="text-gray-500 text-sm mt-1">
              {org.location.formatted_location}
            </p>
          )}
        </div>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center"
          onClick={() => navigate(`/organizations/${org.id}`)}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
        
        <Button
          variant="outline"
          size="sm" 
          className="flex items-center"
          onClick={onEdit}
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Remove
        </Button>
        
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => navigate(`/organizations/${org.id}/edit`)}
          >
            <Building className="h-4 w-4 mr-1" />
            Edit Organization
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrganizationRelationshipList;
