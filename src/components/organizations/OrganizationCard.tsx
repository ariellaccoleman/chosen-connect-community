
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Entity } from "@/types/entity";
import { formatLocation } from "@/utils/formatters/locationFormatters";

interface OrganizationCardProps {
  organization: Entity;
  onClick: () => void;
}

const OrganizationCard = ({ 
  organization, 
  onClick 
}: OrganizationCardProps) => {
  const orgInitials = organization.name
    .split(' ')
    .map((word: string) => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  
  const locationString = organization.location ? formatLocation(organization.location) : '';
  
  return (
    <Card className="h-full hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex space-x-4">
          <Avatar className="h-16 w-16 flex-shrink-0">
            <AvatarImage src={organization.imageUrl || ""} />
            <AvatarFallback className="bg-chosen-blue text-white">
              {orgInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">{organization.name}</h3>
            {locationString && (
              <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">{locationString}</p>
            )}
          </div>
        </div>
        {organization.description && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{organization.description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default OrganizationCard;
