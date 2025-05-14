
import React from "react";
import { Link } from "react-router-dom";
import { Entity } from "@/types/entity";
import { EntityType } from "@/types/entityTypes";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Building, User } from "lucide-react";
import TagList from "../tags/TagList";
import { format } from "date-fns";

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
  const getEntityUrl = (entity: Entity) => {
    switch (entity.entityType) {
      case EntityType.PERSON:
        return `/directory/${entity.id}`;
      case EntityType.ORGANIZATION:
        return `/organizations/${entity.id}`;
      case EntityType.EVENT:
        return `/events/${entity.id}`;
      default:
        return "#";
    }
  };

  const getEntityIcon = (entityType: EntityType) => {
    switch (entityType) {
      case EntityType.PERSON:
        return <User className="h-4 w-4" />;
      case EntityType.ORGANIZATION:
        return <Building className="h-4 w-4" />;
      case EntityType.EVENT:
        return <Calendar className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getEntityTypeLabel = (entityType: EntityType) => {
    switch (entityType) {
      case EntityType.PERSON:
        return "Person";
      case EntityType.ORGANIZATION:
        return "Organization";
      case EntityType.EVENT:
        return "Event";
      default:
        return entityType;
    }
  };

  const getAvatarFallback = (entity: Entity) => {
    if (!entity.name) return "?";
    
    return entity.name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Format date if it's an event
  const formattedDate = entity.entityType === EntityType.EVENT && entity.created_at
    ? format(new Date(entity.created_at), "MMM d, yyyy")
    : null;

  return (
    <Link to={getEntityUrl(entity)} className="block">
      <div className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow ${className}`}>
        <div className="flex items-start gap-4">
          {/* Avatar/Image */}
          <Avatar className="h-12 w-12">
            <AvatarImage src={entity.imageUrl || ""} alt={entity.name} />
            <AvatarFallback className="bg-chosen-blue text-white">
              {getAvatarFallback(entity)}
            </AvatarFallback>
          </Avatar>
          
          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{entity.name}</h3>
              <Badge variant="outline" className="flex items-center gap-1">
                {getEntityIcon(entity.entityType)}
                <span>{getEntityTypeLabel(entity.entityType)}</span>
              </Badge>
            </div>
            
            {entity.description && (
              <p className="text-gray-600 mt-1 line-clamp-2">{entity.description}</p>
            )}
            
            {/* Location info */}
            {entity.location && (
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                <span>{entity.location.formatted_location || entity.location.full_name}</span>
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
            <TagList tagAssignments={entity.tags} />
          </div>
        )}
      </div>
    </Link>
  );
};

export default EntityCard;
