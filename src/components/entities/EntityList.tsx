
import React from "react";
import { Entity } from "@/types/entity";
import EntityCard from "./EntityCard";
import { Skeleton } from "@/components/ui/skeleton";

interface EntityListProps {
  entities: Entity[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  showTags?: boolean;
}

/**
 * Generic list component for displaying entities of any type
 */
const EntityList = ({ 
  entities, 
  isLoading = false, 
  emptyMessage = "No items found", 
  className = "",
  showTags = true
}: EntityListProps) => {
  if (isLoading) {
    return (
      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (!entities || entities.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {entities.map(entity => (
        <EntityCard 
          key={`${entity.entityType}-${entity.id}`}
          entity={entity}
          showTags={showTags}
        />
      ))}
    </div>
  );
};

export default EntityList;
