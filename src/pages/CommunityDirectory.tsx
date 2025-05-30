
import { useState } from "react";
import { EntityType } from "@/types/entityTypes";
import EntityFeed from "@/components/entities/EntityFeed";
import EntitySearchAndFilter from "@/components/common/EntitySearchAndFilter";
import CommunityPagination from "@/components/community/CommunityPagination";

const CommunityDirectory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // Show 12 profiles per page

  // Reset to first page when search or filter changes
  const handleSearchChange = (search: string) => {
    setSearchQuery(search);
    setCurrentPage(1);
  };

  const handleTagChange = (tagId: string | null) => {
    setSelectedTagId(tagId);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        onSearchChange={handleSearchChange}
        onTagChange={handleTagChange}
      />

      <EntityFeed
        defaultEntityTypes={[EntityType.PERSON]}
        showTabs={false}
        showTagFilter={false}
        tagId={selectedTagId}
        search={searchQuery}
        isApproved={true}
        emptyMessage={selectedTagId ? "No community members match the selected tag." : "No community members found. Be the first to join!"}
        className="mt-6"
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        renderPagination={(totalItems, totalPages, hasNextPage) => (
          <CommunityPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            hasNextPage={hasNextPage}
          />
        )}
      />
    </div>
  );
};

export default CommunityDirectory;
