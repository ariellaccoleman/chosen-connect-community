
import React from "react";
import { usePublicProfileTags } from "@/hooks/usePublicProfileTags";
import TagList from "@/components/tags/TagList";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityType } from "@/types/entityTypes";
import { TagAssignmentWithDetails } from "@/types";

interface PublicProfileTagsProps {
  profileId: string;
}

const PublicProfileTags = ({ profileId }: PublicProfileTagsProps) => {
  const { data: tagAssignments, isLoading } = usePublicProfileTags(profileId);
  
  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }
  
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Tags</h3>
      <TagList 
        tagAssignments={tagAssignments || []} 
        currentEntityType={EntityType.PERSON}
      />
    </div>
  );
};

export default PublicProfileTags;
