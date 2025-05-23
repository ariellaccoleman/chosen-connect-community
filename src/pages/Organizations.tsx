
import { useState } from "react";
import { useNavigate, generatePath } from "react-router-dom";
import { useOrganizations } from "@/hooks/organizations";
import { useFilterByTag } from "@/hooks/tags";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Briefcase, Search } from "lucide-react";
import { OrganizationWithLocation } from "@/types";
import { EntityType } from "@/types/entityTypes";
import { APP_ROUTES } from "@/config/routes";
import { logger } from "@/utils/logger";
import { toast } from "@/components/ui/sonner";
import TagSelector from "@/components/tags/TagSelector";
import { Tag } from "@/utils/tags";

const OrganizationsList = () => {
  const navigate = useNavigate();
  const { data: organizationsResponse, isLoading, error } = useOrganizations();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Log page load for debugging
  logger.info("Organizations - Component mounted", {
    path: window.location.pathname
  });
  
  // Extract organizations from the response
  const organizations = organizationsResponse?.data || [];
  
  // Use tag hooks directly
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const { data: tagAssignments = [] } = useFilterByTag(selectedTagId, EntityType.ORGANIZATION);

  // Show error toast if organization loading fails
  if (error) {
    console.error("Error fetching organizations:", error);
    toast.error("Failed to load organizations. Please try again.");
  }

  // First filter by search term
  const searchFilteredOrgs = organizations.filter((org: OrganizationWithLocation) => {
    return org.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (org.description && org.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (org.location?.formatted_location && org.location.formatted_location.toLowerCase().includes(searchTerm.toLowerCase()));
  });
  
  // Filter by tag id if selected
  const filteredOrganizations = selectedTagId
    ? searchFilteredOrgs.filter(org => {
        const taggedIds = new Set(tagAssignments.map((ta) => ta.target_id));
        return taggedIds.has(org.id);
      })
    : searchFilteredOrgs;
    
  // Handle clicking on an organization card
  const handleViewOrganization = (orgId: string) => {
    // Use generatePath to correctly create the URL with parameters
    const orgDetailUrl = generatePath(APP_ROUTES.ORGANIZATION_DETAIL, { orgId });
    navigate(orgDetailUrl);
  };
  
  // Handle tag selection
  const handleTagSelected = (tag: Tag) => {
    setSelectedTagId(tag.id || null);
    logger.debug(`Tag selected: ${tag.name} (${tag.id})`);
  };
  
  // Clear tag filter
  const clearTagFilter = () => {
    setSelectedTagId(null);
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
                onTagSelected={handleTagSelected}
                currentSelectedTagId={selectedTagId}
              />
              {selectedTagId && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearTagFilter}
                  className="mt-2"
                >
                  Clear filter
                </Button>
              )}
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
          <p className="text-gray-500 dark:text-gray-400">No organizations found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

const OrganizationCard = ({ 
  organization, 
  onClick 
}: { 
  organization: OrganizationWithLocation;
  onClick: () => void;
}) => {
  const orgInitials = organization.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  
  return (
    <Card className="h-full hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex space-x-4">
          <Avatar className="h-16 w-16 flex-shrink-0">
            <AvatarImage src={organization.logoUrl || organization.logoApiUrl || ""} />
            <AvatarFallback className="bg-chosen-blue text-white">
              {orgInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">{organization.name}</h3>
            {organization.location && (
              <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">{organization.location.formatted_location}</p>
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
