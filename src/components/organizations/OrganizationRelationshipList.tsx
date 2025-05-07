
import { ProfileOrganizationRelationshipWithDetails } from "@/types";
import OrganizationCard from "@/components/organizations/OrganizationCard";

interface OrganizationRelationshipListProps {
  relationships: ProfileOrganizationRelationshipWithDetails[];
  onEditClick: (relationship: ProfileOrganizationRelationshipWithDetails) => void;
  emptyMessage?: string;
}

const OrganizationRelationshipList = ({ 
  relationships, 
  onEditClick,
  emptyMessage = "No organizations" 
}: OrganizationRelationshipListProps) => {
  if (relationships.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {relationships.map(relationship => (
        <OrganizationCard 
          key={relationship.id} 
          relationship={relationship}
          showActions={true}
          onEditClick={() => onEditClick(relationship)}
        />
      ))}
    </div>
  );
};

export default OrganizationRelationshipList;
