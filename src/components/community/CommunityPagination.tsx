
import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { logger } from "@/utils/logger";

interface CommunityPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
  hasNextPage?: boolean;
}

const CommunityPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  hasNextPage = false
}: CommunityPaginationProps) => {
  logger.debug("CommunityPagination render:", {
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    hasNextPage
  });

  if (totalPages <= 1 && !hasNextPage) {
    logger.debug("CommunityPagination: Not rendering - only 1 page and no next page");
    return null;
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  logger.debug("CommunityPagination: Item range calculation:", {
    startItem,
    endItem,
    calculation: `(${currentPage} - 1) * ${itemsPerPage} + 1 = ${startItem}, min(${currentPage} * ${itemsPerPage}, ${totalItems}) = ${endItem}`
  });

  const getVisiblePages = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if we have 5 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, current page and surrounding pages, last page
      if (currentPage <= 3) {
        // Show first 3 pages + ellipsis + last page
        for (let i = 1; i <= 3; i++) {
          pages.push(i);
        }
        if (totalPages > 4) {
          pages.push(-1); // ellipsis
          pages.push(totalPages);
        }
      } else if (currentPage >= totalPages - 2) {
        // Show first page + ellipsis + last 3 pages
        pages.push(1);
        if (totalPages > 4) {
          pages.push(-1); // ellipsis
        }
        for (let i = totalPages - 2; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show first + ellipsis + current-1, current, current+1 + ellipsis + last
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-2); // ellipsis
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  logger.debug("CommunityPagination: Visible pages:", visiblePages);

  const handlePageChange = (page: number) => {
    logger.debug("CommunityPagination: Page change clicked:", {
      oldPage: currentPage,
      newPage: page,
      totalPages,
      hasNextPage
    });
    onPageChange(page);
  };

  const handlePreviousClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentPage > 1) {
      logger.debug("CommunityPagination: Previous clicked, going to page:", currentPage - 1);
      handlePageChange(currentPage - 1);
    } else {
      logger.debug("CommunityPagination: Previous clicked but already on first page");
    }
  };

  const handleNextClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentPage < totalPages || hasNextPage) {
      logger.debug("CommunityPagination: Next clicked, going to page:", currentPage + 1);
      handlePageChange(currentPage + 1);
    } else {
      logger.debug("CommunityPagination: Next clicked but already on last page");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      <div className="text-sm text-gray-600">
        Showing {startItem} to {endItem} of {totalItems} members
      </div>
      
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              href="#"
              onClick={handlePreviousClick}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          
          {visiblePages.map((page, index) => (
            <PaginationItem key={index}>
              {page === -1 || page === -2 ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    logger.debug("CommunityPagination: Page link clicked:", page);
                    handlePageChange(page);
                  }}
                  isActive={page === currentPage}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          
          <PaginationItem>
            <PaginationNext 
              href="#"
              onClick={handleNextClick}
              className={(currentPage === totalPages && !hasNextPage) ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default CommunityPagination;
