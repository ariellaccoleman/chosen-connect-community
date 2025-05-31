
import React from "react";
import TagList from "./TagList";
import { TagAssignment } from "@/utils/tags/types";
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
  // New prop to accept pre-loaded tags from aggregated views
  tags?: any[];
}

/**
 * Pure display component for entity tags - shows tag pills like on entity cards
 * Now supports both fetching tags and using pre-loaded aggregated tags
 */
const EntityTagDisplay = ({
  entityId,
  entityType,
  className = "",
  maxTags = 10,
  showDebugInfo = false,
  tags: preloadedTags
}: EntityTagDisplayProps) => {
  // Only fetch tags if not provided
  const { data: tagAssignments, isLoading, isError } = useEntityTags(
    entityId, 
    entityType, 
    { enabled: !preloadedTags } // Disable query if we have preloaded tags
  );

  // Use preloaded tags if available, otherwise use fetched assignments
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

  return (
    <TagList 
      tagAssignments={tagAssignments}
      className={className}
      maxTags={maxTags}
      showDebugInfo={showDebugInfo}
    />
  );
};

export default EntityTagDisplay;
