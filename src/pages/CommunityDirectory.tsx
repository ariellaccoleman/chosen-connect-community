
import { useState } from "react";
import { EntityType } from "@/types/entityTypes";
import EntityFeed from "@/components/entities/EntityFeed";
import EntitySearchAndFilter from "@/components/common/EntitySearchAndFilter";
import CommunityPagination from "@/components/community/CommunityPagination";
import { logger } from "@/utils/logger";

const CommunityDirectory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // Show 12 profiles per page

  logger.debug("CommunityDirectory render:", { 
    currentPage, 
    searchQuery, 
    selectedTagId,
    itemsPerPage 
  });

  // Reset to first page when search or filter changes
  const handleSearchChange = (search: string) => {
    logger.debug("CommunityDirectory handleSearchChange:", { 
      oldSearch: searchQuery, 
      newSearch: search, 
      currentPageBeforeReset: currentPage 
    });
    setSearchQuery(search);
    setCurrentPage(1);
    logger.debug("CommunityDirectory after search change:", { 
      searchQuery: search, 
      currentPage: 1 
    });
  };

  const handleTagChange = (tagId: string | null) => {
    logger.debug("CommunityDirectory handleTagChange:", { 
      oldTagId: selectedTagId, 
      newTagId: tagId, 
      currentPageBeforeReset: currentPage 
    });
    setSelectedTagId(tagId);
    setCurrentPage(1);
    logger.debug("CommunityDirectory after tag change:", { 
      selectedTagId: tagId, 
      currentPage: 1 
    });
  };

  const handlePageChange = (page: number) => {
    logger.debug("CommunityDirectory handlePageChange called:", { 
      oldPage: currentPage, 
      newPage: page,
      searchQuery,
      selectedTagId
    });
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
    logger.debug("CommunityDirectory after page change:", { 
      currentPage: page 
    });
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
        renderPagination={(totalItems, totalPages, hasNextPage) => {
          logger.debug("CommunityDirectory renderPagination called:", { 
            totalItems, 
            totalPages, 
            hasNextPage, 
            currentPageProp: currentPage 
          });
          return (
            <CommunityPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              hasNextPage={hasNextPage}
            />
          );
        }}
      />
    </div>
  );
};

export default CommunityDirectory;
