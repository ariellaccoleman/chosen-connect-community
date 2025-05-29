
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Briefcase, Search } from "lucide-react";
import { EntityType } from "@/types/entityTypes";
import { APP_ROUTES } from "@/config/routes";
import { logger } from "@/utils/logger";
import TagSelector from "@/components/tags/TagSelector";
import { Tag } from "@/utils/tags/types";
import FilterPills from "@/components/filters/FilterPills";
import EntityFeed from "@/components/entities/EntityFeed";

const OrganizationsList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  
  // Log page load for debugging
  logger.info("Organizations - Component mounted", {
    path: window.location.pathname,
    selectedTagId
  });
  
  // Handle tag selection
  const handleTagSelect = (tag: Tag) => {
    logger.debug(`Organizations: Tag selected: ${tag.id}`);
    if (tag.id === "") {
      // Empty tag means clear filter
      setSelectedTagId(null);
    } else {
      setSelectedTagId(tag.id);
    }
  };

  // Prepare filter pills
  const filterPills = [];
  if (selectedTagId) {
    // Note: We'll need to get the tag name from the entities once they're loaded
    // For now, just show the tag ID
    filterPills.push({
      id: selectedTagId,
      label: `Tag: ${selectedTagId}`,
      onRemove: () => setSelectedTagId(null)
    });
  }

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
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search organizations by name, description, or location"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="md:w-64">
              <TagSelector
                targetType={EntityType.ORGANIZATION}
                onTagSelected={handleTagSelect}
                isAdmin={false}
                placeholder="Select a tag to filter organizations"
                currentSelectedTagId={selectedTagId}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <FilterPills filters={filterPills} />

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
