
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, ExternalLink } from "lucide-react";
import { Entity } from "@/types/entity";
import TagList from "@/components/tags/TagList";
import { formatLocation } from "@/utils/formatters/locationFormatters";

interface OrganizationCardProps {
  organization: Entity;
  onClick?: () => void;
}

/**
 * Organization card component that displays organization information with simplified tags
 * Now expects organization.tags to be Tag[] from views
 */
const OrganizationCard = ({ organization, onClick }: OrganizationCardProps) => {
  // Format location for display
  const locationDisplay = organization.location ? formatLocation(organization.location) : null;

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar/Logo */}
          <Avatar className="h-12 w-12">
            <AvatarImage src={organization.imageUrl || ""} alt={organization.name} />
            <AvatarFallback className="bg-chosen-blue text-white">
              {organization.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          {/* Content */}
          <div className="flex-1">
            {/* Header with title and verified badge */}
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-lg pr-2">{organization.name}</h3>
              <div className="flex items-center gap-2">
                {(organization as any).is_verified && (
                  <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                    Verified
                  </Badge>
                )}
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            {organization.description && (
              <p className="text-gray-600 mt-1 text-sm line-clamp-2">{organization.description}</p>
            )}
            
            {/* Location info */}
            {locationDisplay && (
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                <span>{locationDisplay}</span>
              </div>
            )}
            
            {/* Website */}
            {(organization as any).website_url && (
              <div className="mt-2">
                <a 
                  href={(organization as any).website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(organization as any).website_url}
                </a>
              </div>
            )}
          </div>
        </div>
        
        {/* Tags - now uses simplified Tag[] array */}
        {organization.tags && organization.tags.length > 0 && (
          <div className="mt-4">
            <TagList tags={organization.tags} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrganizationCard;
