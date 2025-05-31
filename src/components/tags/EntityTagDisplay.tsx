
import React from "react";
import TagList from "./TagList";
import { Tag } from "@/utils/tags/types";
import { EntityType } from "@/types/entityTypes";
import { useEntityTags } from "@/hooks/tags/useTagFactoryHooks";
import { Skeleton } from "@/components/ui/skeleton";
import { logger } from "@/utils/logger";

interface EntityTagDisplayProps {
  entityId: string;
  entityType: EntityType;
  className?: string;
  maxTags?: number;
  showDebugInfo?: boolean;
  // Pre-loaded tags from aggregated views (preferred)
  tags?: Tag[];
}

/**
 * Pure display component for entity tags - shows tag pills like on entity cards
 * Now only supports simplified Tag[] format from views
 */
const EntityTagDisplay = ({
  entityId,
  entityType,
  className = "",
  maxTags = 10,
  showDebugInfo = false,
  tags: preloadedTags
}: EntityTagDisplayProps) => {
  // Only fetch tags if not provided (fallback for legacy components)
  const { data: tagAssignments, isLoading, isError } = useEntityTags(
    entityId, 
    entityType
  );

  // Use preloaded tags if available (preferred approach)
  if (preloadedTags && preloadedTags.length > 0) {
    return (
      <TagList 
        tags={preloadedTags}
        className={className}
        maxTags={maxTags}
        showDebugInfo={showDebugInfo}
      />
    );
  }

  if (isLoading) {
    return <Skeleton className="h-6 w-32" />;
  }

  if (isError) {
    logger.error(`Failed to load tags for ${entityType} ${entityId}`);
    return null;
  }

  if (!tagAssignments || tagAssignments.length === 0) {
    return null;
  }

  // Convert TagAssignment[] to Tag[] for legacy support
  const simpleTags: Tag[] = tagAssignments
    .filter(assignment => assignment.tag)
    .map(assignment => assignment.tag!)
    .filter(Boolean);

  return (
    <TagList 
      tags={simpleTags}
      className={className}
      maxTags={maxTags}
      showDebugInfo={showDebugInfo}
    />
  );
};

export default EntityTagDisplay;
