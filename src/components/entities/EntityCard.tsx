
import React from "react";
import { Link } from "react-router-dom";
import { Entity } from "@/types/entityRegistry";
import { EntityType } from "@/types/entityTypes";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar } from "lucide-react";
import TagList from "../tags/TagList";
import { format } from "date-fns";
import { useEntityRegistry } from "@/hooks/useEntityRegistry";
import { logger } from "@/utils/logger";

interface EntityCardProps {
  entity: Entity;
  className?: string;
  showTags?: boolean;
}

/**
 * Generic card component for displaying any entity type
 * Uses entity.entityType to determine how to render the entity
 */
const EntityCard = ({ entity, className = "", showTags = true }: EntityCardProps) => {
  const { 
    getEntityUrl, 
    getEntityIcon, 
    getEntityTypeLabel, 
    getEntityAvatarFallback 
  } = useEntityRegistry();

  // Format date if it's an event
  const formattedDate = entity.entityType === EntityType.EVENT && entity.created_at
    ? format(new Date(entity.created_at), "MMM d, yyyy")
    : null;
    
  // Generate URL and log it for debugging
  const entityUrl = getEntityUrl(entity);
  logger.debug(`EntityCard: Generated URL for ${entity.entityType} ${entity.id}: ${entityUrl}`);

  // Function to format location display
  const formatLocation = (location: any) => {
    if (!location) return null;
    
    if (typeof location === 'string') {
      return location;
    }
    
    // Handle location object with properties
    return location.formatted_location || location.full_name || location.city;
  };

  return (
    <Link to={entityUrl} className="block">
      <div className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow ${className}`}>
        <div className="flex items-start gap-4">
          {/* Avatar/Image */}
          <Avatar className="h-12 w-12">
            <AvatarImage src={entity.imageUrl || ""} alt={entity.name} />
            <AvatarFallback className="bg-chosen-blue text-white">
              {getEntityAvatarFallback(entity)}
            </AvatarFallback>
          </Avatar>
          
          {/* Content */}
          <div className="flex-1">
            {/* Header with title and badge */}
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-lg pr-2">{entity.name}</h3>
              <Badge variant="outline" className="flex-shrink-0 flex items-center gap-1">
                {getEntityIcon(entity.entityType)}
                <span>{getEntityTypeLabel(entity.entityType)}</span>
              </Badge>
            </div>
            
            {entity.description && (
              <p className="text-gray-600 mt-1">{entity.description}</p>
            )}
            
            {/* Location info */}
            {entity.location && (
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                <span>{formatLocation(entity.location)}</span>
              </div>
            )}
            
            {/* Event date */}
            {formattedDate && (
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                <span>{formattedDate}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Tags */}
        {showTags && entity.tags && entity.tags.length > 0 && (
          <div className="mt-4">
            <TagList tagIds={entity.tags as string[]} />
          </div>
        )}
      </div>
    </Link>
  );
};

export default EntityCard;
