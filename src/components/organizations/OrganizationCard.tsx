
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Briefcase, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { ProfileOrganizationRelationshipWithDetails } from "@/types";

interface OrganizationCardProps {
  relationship: ProfileOrganizationRelationshipWithDetails;
  showActions?: boolean;
  onEditClick?: () => void;
}

const OrganizationCard = ({ 
  relationship, 
  showActions = false,
  onEditClick 
}: OrganizationCardProps) => {
  if (!relationship.organization) return null;
  
  const organization = relationship.organization;
  
  const orgInitials = organization.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  
  const connectionLabel = {
    current: "Current",
    former: "Former",
    ally: "Allied Organization"
  }[relationship.connection_type || "current"];
  
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between">
          <div className="flex space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={organization.logo_url || organization.logo_api_url || ""} />
              <AvatarFallback className="bg-chosen-blue text-white">
                {orgInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center mb-1">
                <h3 className="text-lg font-semibold">{organization.name}</h3>
                <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                  {connectionLabel}
                </span>
              </div>
              
              {organization.location && (
                <p className="text-sm text-gray-500 mb-1">{organization.location.formatted_location}</p>
              )}
              
              {relationship.department && (
                <p className="text-sm flex items-center">
                  <Briefcase className="h-3 w-3 mr-1 text-gray-600" />
                  <span>{relationship.department}</span>
                </p>
              )}
            </div>
          </div>
        </div>
        
        {relationship.notes && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-600">{relationship.notes}</p>
          </div>
        )}
        
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            asChild
          >
            <Link to={`/organizations/${organization.id}`}>
              <Eye className="h-4 w-4 mr-1" />
              View Organization
            </Link>
          </Button>
          
          {showActions && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center text-chosen-blue hover:text-chosen-navy hover:bg-blue-50"
              onClick={onEditClick}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit Relationship
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizationCard;
