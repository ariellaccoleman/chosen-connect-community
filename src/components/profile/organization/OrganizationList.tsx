
import { Button } from "@/components/ui/button";
import { OrganizationRelationshipWithDetails } from "@/types";

interface OrganizationListProps {
  relationships: OrganizationRelationshipWithDetails[];
  isLoading: boolean;
  onManageClick: () => void;
}

const OrganizationList = ({ 
  relationships, 
  isLoading, 
  onManageClick 
}: OrganizationListProps) => {
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
          <div 
            key={relationship.id} 
            className="flex items-start justify-between p-3 border rounded-md"
          >
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
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="text-gray-500"
              onClick={onManageClick}
            >
              Edit
            </Button>
          </div>
        );
      })}
    </div>
  );
};

export default OrganizationList;
