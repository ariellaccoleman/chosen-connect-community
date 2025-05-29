
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Briefcase } from "lucide-react";
import { EntityType } from "@/types/entityTypes";
import { APP_ROUTES } from "@/config/routes";
import { logger } from "@/utils/logger";
import EntityFeed from "@/components/entities/EntityFeed";
import EntitySearchAndFilter from "@/components/common/EntitySearchAndFilter";

const OrganizationsList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  
  // Log page load for debugging
  logger.info("Organizations - Component mounted", {
    path: window.location.pathname,
    selectedTagId
  });

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold font-heading text-gray-900 dark:text-white">Organizations</h1>
        <Button 
          onClick={() => navigate(APP_ROUTES.MANAGE_ORGANIZATIONS)} 
          className="bg-chosen-blue hover:bg-chosen-navy w-full sm:w-auto"
        >
          <Briefcase className="mr-2 h-4 w-4" />
          Manage Your Organizations
        </Button>
      </div>
      
      <EntitySearchAndFilter
        entityType={EntityType.ORGANIZATION}
        searchPlaceholder="Search organizations by name, description, or location"
        tagPlaceholder="Select a tag to filter organizations"
        onSearchChange={setSearchTerm}
        onTagChange={setSelectedTagId}
      />

      <EntityFeed
        defaultEntityTypes={[EntityType.ORGANIZATION]}
        showTabs={false}
        showTagFilter={false}
        tagId={selectedTagId}
        search={searchTerm}
        isApproved={true}
        emptyMessage={selectedTagId ? "No organizations match the selected tag and search criteria" : "No organizations found matching your search criteria"}
        className="mt-6"
      />
    </div>
  );
};

export default OrganizationsList;
