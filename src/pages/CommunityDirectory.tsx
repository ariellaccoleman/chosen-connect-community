
import { useState } from "react";
import { EntityType } from "@/types/entityTypes";
import EntityFeed from "@/components/entities/EntityFeed";
import EntitySearchAndFilter from "@/components/common/EntitySearchAndFilter";

const CommunityDirectory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  return (
    <div className="container max-w-6xl px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Community Directory
        </h1>
      </div>

      <EntitySearchAndFilter
        entityType={EntityType.PERSON}
        searchPlaceholder="Search community members..."
        tagPlaceholder="Select a tag to filter members"
        onSearchChange={setSearchQuery}
        onTagChange={setSelectedTagId}
      />

      <EntityFeed
        defaultEntityTypes={[EntityType.PERSON]}
        showTabs={false}
        showTagFilter={false}
        tagId={selectedTagId}
        search={searchQuery}
        isApproved={true}
        limit={50}
        emptyMessage={selectedTagId ? "No community members match the selected tag." : "No community members found. Be the first to join!"}
        className="mt-6"
      />
    </div>
  );
};

export default CommunityDirectory;
