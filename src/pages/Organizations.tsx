
import { useState } from "react";
import { useNavigate, generatePath } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Briefcase, Search } from "lucide-react";
import { EntityType } from "@/types/entityTypes";
import { APP_ROUTES } from "@/config/routes";
import { logger } from "@/utils/logger";
import { toast } from "@/components/ui/sonner";
import TagFilter from "@/components/filters/TagFilter";
import { useEntityFeed } from "@/hooks/useEntityFeed";
import { formatLocation } from "@/utils/formatters/locationFormatters";

const OrganizationsList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  
  // Use the entity feed hook to fetch organizations - same as community page
  const { entities: organizationEntities, isLoading, error } = useEntityFeed({
    entityTypes: [EntityType.ORGANIZATION],
    tagId: selectedTagId,
    limit: 100
  });
  
  // Log page load for debugging
  logger.info("Organizations - Component mounted", {
    path: window.location.pathname,
    organizationCount: organizationEntities.length,
    selectedTagId
  });
  
  // Show error toast if organization loading fails
  if (error) {
    console.error("Error fetching organizations:", error);
    toast.error("Failed to load organizations. Please try again.");
  }

  // Filter by search term
  const filteredOrganizations = organizationEntities.filter((entity) => {
    const searchLower = searchTerm.toLowerCase();
    const locationString = entity.location ? formatLocation(entity.location) : '';
    
    return (
      entity.name.toLowerCase().includes(searchLower) ||
      (entity.description && entity.description.toLowerCase().includes(searchLower)) ||
      (locationString && locationString.toLowerCase().includes(searchLower))
    );
  });
    
  // Handle clicking on an organization card
  const handleViewOrganization = (orgId: string) => {
    const orgDetailUrl = generatePath(APP_ROUTES.ORGANIZATION_DETAIL, { orgId });
    navigate(orgDetailUrl);
  };
  
  // Handle tag selection - same as community page
  const handleTagSelect = (tagId: string | null) => {
    logger.debug(`Organizations: Tag selected: ${tagId}`);
    setSelectedTagId(tagId);
  };

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
          <div className="flex flex-col gap-4">
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
            
            {/* Tag filter - same as community page */}
            <div className="mb-4 sm:mb-6">
              <TagFilter
                selectedTagId={selectedTagId}
                onTagSelect={handleTagSelect}
                targetType={EntityType.ORGANIZATION}
                label="Filter organizations by tag"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="text-center py-12">Loading organizations...</div>
      ) : filteredOrganizations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((organization) => (
            <OrganizationCard 
              key={organization.id} 
              organization={organization} 
              onClick={() => handleViewOrganization(organization.id)} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {selectedTagId 
              ? "No organizations found matching the selected tag and search criteria" 
              : "No organizations found matching your search criteria"
            }
          </p>
          {selectedTagId && (
            <Button 
              variant="ghost" 
              onClick={() => setSelectedTagId(null)}
              className="mt-2"
            >
              Clear tag filter
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

const OrganizationCard = ({ 
  organization, 
  onClick 
}: { 
  organization: any;
  onClick: () => void;
}) => {
  const orgInitials = organization.name
    .split(' ')
    .map((word: string) => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  
  const locationString = organization.location ? formatLocation(organization.location) : '';
  
  return (
    <Card className="h-full hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex space-x-4">
          <Avatar className="h-16 w-16 flex-shrink-0">
            <AvatarImage src={organization.imageUrl || ""} />
            <AvatarFallback className="bg-chosen-blue text-white">
              {orgInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">{organization.name}</h3>
            {locationString && (
              <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">{locationString}</p>
            )}
          </div>
        </div>
        {organization.description && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{organization.description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default OrganizationsList;
