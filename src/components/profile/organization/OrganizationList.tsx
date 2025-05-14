import { Button } from "@/components/ui/button";
import { Eye, Edit, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { ProfileOrganizationRelationshipWithDetails } from "@/types";
import { useIsOrganizationAdmin } from "@/hooks/useOrganizationAdmins";
import { useAuth } from "@/hooks/useAuth";

interface OrganizationListProps {
  relationships: ProfileOrganizationRelationshipWithDetails[];
  isLoading: boolean;
  onManageClick: () => void;
}

const OrganizationList = ({ 
  relationships, 
  isLoading, 
  onManageClick 
}: OrganizationListProps) => {
  const { user } = useAuth();
  
  if (isLoading) {
    return <div>Loading your organizations...</div>;
  }

  if (relationships.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        You haven't added any organization connections yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {relationships.map(relationship => {
        const org = relationship.organization;
        if (!org) return null;
        
        return (
          <OrganizationItem 
            key={relationship.id}
            relationship={relationship}
            userId={user?.id}
            onManageClick={onManageClick}
          />
        );
      })}
    </div>
  );
};

interface OrganizationItemProps {
  relationship: ProfileOrganizationRelationshipWithDetails;
  userId?: string;
  onManageClick: () => void;
}

const OrganizationItem = ({ relationship, userId, onManageClick }: OrganizationItemProps) => {
  const org = relationship.organization;
  if (!org) return null;
  
  // Force a query with both parameters defined to ensure we get the correct result
  const { data: isAdmin = false } = useIsOrganizationAdmin(
    userId || '', 
    org.id || ''
  );
  
  return (
    <div className="flex flex-col p-4 border rounded-md space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium">{org.name}</div>
          <div className="text-sm text-muted-foreground">
            {relationship.connection_type === 'current' ? 'Current' : 
             relationship.connection_type === 'former' ? 'Former' : 'Allied'}
            {relationship.department && ` • ${relationship.department}`}
          </div>
          {relationship.notes && (
            <div className="text-sm mt-1 text-gray-600">{relationship.notes}</div>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center"
          asChild
        >
          <Link to={`/organizations/${org.id}`}>
            <Eye className="h-4 w-4 mr-1" />
            View Organization
          </Link>
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          className="flex items-center" 
          onClick={onManageClick}
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit Relationship
        </Button>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            asChild
          >
            <Link to={`/organizations/${org.id}/edit`}>
              <Settings className="h-4 w-4 mr-1" />
              Edit Organization
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrganizationList;
