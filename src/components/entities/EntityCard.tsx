
import React from "react";
import { Link } from "react-router-dom";
import { Entity } from "@/types/entity";
import { EntityType } from "@/types/entityTypes";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar } from "lucide-react";
import TagList from "../tags/TagList";
import { format } from "date-fns";
import { useEntityRegistry } from "@/hooks/useEntityRegistry";
import { logger } from "@/utils/logger";
import { formatLocation } from "@/utils/formatters/locationFormatters";

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

  // Safe check for entity type
  if (!entity || !entity.entityType) {
    logger.error("EntityCard: Invalid entity or missing entity type", entity);
    return null;
  }

  // Debug entity data and registry access
  logger.debug(`EntityCard: Rendering entity with type "${entity.entityType}"`, {
    id: entity.id,
    entityType: entity.entityType,
    name: entity.name
  });

  // Format date if it's an event
  const formattedDate = entity.entityType === EntityType.EVENT && entity.created_at
    ? format(new Date(entity.created_at), "MMM d, yyyy")
    : null;
    
  // Generate URL and log it for debugging
  const entityUrl = getEntityUrl(entity);
  
  // Make sure we have a valid entity type
  const entityTypeLabel = getEntityTypeLabel(entity.entityType);
  
  // Debug the entity type label resolution
  logger.debug(`EntityCard: Entity type "${entity.entityType}" resolved to label "${entityTypeLabel}"`);
  
  if (entityTypeLabel === 'Unknown') {
    logger.error(`EntityCard: Unknown entity type for entity: ${entity.id}, type: ${entity.entityType}`, {
      availableEntityTypes: Object.values(EntityType),
      entityTypeValue: entity.entityType
    });
  }

  // Format location for display
  const locationDisplay = entity.location ? formatLocation(entity.location) : null;

  return (
    <Link to={entityUrl} className="block">
      <div className={`bg-card text-card-foreground dark:bg-gray-800 dark:text-gray-50 shadow rounded-lg p-6 hover:shadow-md transition-shadow ${className}`}>
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
              <h3 className="font-semibold text-lg pr-2 dark:text-white">{entity.name}</h3>
              <Badge variant="outline" className="flex-shrink-0 flex items-center gap-1 dark:text-gray-200 dark:border-gray-600">
                {getEntityIcon(entity.entityType)}
                <span>{entityTypeLabel}</span>
              </Badge>
            </div>
            
            {entity.description && (
              <p className="text-gray-600 mt-1 dark:text-gray-300">{entity.description}</p>
            )}
            
            {/* Location info */}
            {locationDisplay && (
              <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-300">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                <span>{locationDisplay}</span>
              </div>
            )}
            
            {/* Event date */}
            {formattedDate && (
              <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-300">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                <span>{formattedDate}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Tags */}
        {showTags && entity.tags && entity.tags.length > 0 && (
          <div className="mt-4">
            <TagList tagAssignments={entity.tags} />
          </div>
        )}
      </div>
    </Link>
  );
};

export default EntityCard;
