
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { ProfileOrganizationRelationshipWithDetails } from "@/types";
import { formatLocation } from "@/utils/formatters/locationFormatters";
import { formatConnectionType } from "@/utils/formatters/organizationFormatters";

interface RelationshipCardProps {
  relationship: ProfileOrganizationRelationshipWithDetails;
  onEditClick: () => void;
}

const RelationshipCard = ({ 
  relationship, 
  onEditClick 
}: RelationshipCardProps) => {
  const org = relationship.organization;
  const orgInitials = org.name
    .split(' ')
    .map((word: string) => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  
  const locationString = org.location ? formatLocation(org.location) : '';
  
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex space-x-4 min-w-0 flex-1">
            <Avatar className="h-16 w-16 flex-shrink-0">
              <AvatarImage src={org.logo_url || ""} />
              <AvatarFallback className="bg-chosen-blue text-white">
                {orgInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">{org.name}</h3>
              {locationString && (
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">{locationString}</p>
              )}
              <p className="text-sm font-medium text-chosen-blue">
                {formatConnectionType(relationship.connection_type)}
              </p>
              {relationship.department && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {relationship.department}
                </p>
              )}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onEditClick}
            className="flex-shrink-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
        {org.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300">{org.description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default RelationshipCard;
