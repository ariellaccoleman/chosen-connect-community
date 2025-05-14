import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrganizations } from "@/hooks/useOrganizationQueries";
import { useTagFilter } from "@/hooks/useTagFilter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Briefcase, Search } from "lucide-react";
import { OrganizationWithLocation } from "@/types";
import { formatWebsiteUrl } from "@/utils/formatters/urlFormatters";
import TagFilter from "@/components/filters/TagFilter";
import { toast } from "@/components/ui/sonner";
import { EntityType } from "@/types/entityTypes";
import { Entity } from "@/types/entity";

const OrganizationsList = () => {
  const navigate = useNavigate();
  const { data: organizationsResponse, isLoading, error } = useOrganizations();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Extract organizations from the response
  const organizations = organizationsResponse?.data || [];
  
  // Use our tag filter hook
  const { 
    selectedTagId, 
    setSelectedTagId, 
    filterItemsByTag,
    tags: filterTags,
    isLoading: isTagsLoading
  } = useTagFilter({ 
    entityType: EntityType.ORGANIZATION 
  });

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
  
  // Convert organizations to Entity type for filtering
  const orgsAsEntities: Entity[] = searchFilteredOrgs.map(org => ({
    id: org.id,
    entityType: EntityType.ORGANIZATION,
    name: org.name,
    description: org.description,
    tags: org.tags,
    created_at: org.created_at,
    updated_at: org.updated_at
  }));
  
  // Apply tag filtering and convert back
  const filteredEntityIds = filterItemsByTag(orgsAsEntities).map(entity => entity.id);
  const filteredOrganizations = searchFilteredOrgs.filter(org => 
    filteredEntityIds.includes(org.id) || !selectedTagId
  );

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold font-heading">Organizations</h1>
        <Button 
          onClick={() => navigate("/organizations/manage-connections")} 
          className="bg-chosen-blue hover:bg-chosen-navy w-full sm:w-auto"
        >
          <Briefcase className="mr-2 h-4 w-4" />
          Manage Your Organizations
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search organizations by name, description, or location"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <TagFilter 
            selectedTagId={selectedTagId} 
            onTagSelect={setSelectedTagId} 
            tags={filterTags}
            isLoading={isTagsLoading}
          />
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
              onClick={() => navigate(`/organizations/${organization.id}`)} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No organizations found matching your criteria</p>
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
            <AvatarImage src={organization.logo_url || organization.logo_api_url || ""} />
            <AvatarFallback className="bg-chosen-blue text-white">
              {orgInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold mb-1 break-words">{organization.name}</h3>
            {organization.location && (
              <p className="text-sm text-gray-500 mb-2 truncate">{organization.location.formatted_location}</p>
            )}
          </div>
        </div>
        {organization.description && (
          <p className="mt-4 text-sm text-gray-600 line-clamp-3">{organization.description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default OrganizationsList;
