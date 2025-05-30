
import React from "react";
import { useEntityTags } from "@/hooks/tags/useTagFactoryHooks";
import TagList from "@/components/tags/TagList";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityType } from "@/types/entityTypes";

interface PublicProfileTagsProps {
  profileId: string;
}

const PublicProfileTags = ({ profileId }: PublicProfileTagsProps) => {
  const { data: tagAssignments, isLoading } = useEntityTags(profileId, EntityType.PERSON);
  
  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }
  
  // Extract tags from TagAssignments for display
  const tags = tagAssignments
    ?.filter(assignment => assignment.tag)
    .map(assignment => assignment.tag!) || [];
  
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Tags</h3>
      <TagList 
        tags={tags}
        className="flex flex-wrap gap-2"
      />
    </div>
  );
};

export default PublicProfileTags;
