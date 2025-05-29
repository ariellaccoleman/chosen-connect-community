
import React from "react";
import { useEntityTags } from "@/hooks/tags/useTagHooks";
import TagList from "@/components/tags/TagList";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityType } from "@/types/entityTypes";

interface PublicProfileTagsProps {
  profileId: string;
}

const PublicProfileTags = ({ profileId }: PublicProfileTagsProps) => {
  const { data: tagsResponse, isLoading } = useEntityTags(profileId, EntityType.PERSON);
  
  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }
  
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Tags</h3>
      <TagList 
        tagAssignments={tagsResponse?.data || []} 
        className="flex flex-wrap gap-2"
      />
    </div>
  );
};

export default PublicProfileTags;
