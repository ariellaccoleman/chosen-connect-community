
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useOrganizations } from '@/hooks/organizations';
import { useSelectionTags } from '@/hooks/tags';
import { EntityType } from '@/types/entityTypes';
import { APP_ROUTES } from '@/config/routes';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import OrganizationCard from '@/components/organizations/OrganizationCard';
import TagFilter from '@/components/filters/TagFilter';

const Organizations = () => {
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  
  // Get tag data for filtering
  const { data: tagsResponse, isLoading: isTagsLoading } = useSelectionTags(EntityType.ORGANIZATION);
  const tags = tagsResponse?.data || [];
  
  // Get organization data with optional tag filter
  const { data: organizations = [], isLoading } = useOrganizations({
    tagId: selectedTagId || undefined
  });

  return (
    <div className="container mx-auto py-8">
      <Helmet>
        <title>Organizations | CHOSEN</title>
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Organizations</h1>
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
          <div className="w-full sm:w-72">
            <TagFilter
              selectedTagId={selectedTagId}
              onSelectTag={setSelectedTagId}
              tags={tags}
              isLoading={isTagsLoading}
            />
          </div>
          <Link to={APP_ROUTES.CREATE_ORGANIZATION}>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Create Organization
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : organizations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <OrganizationCard
              key={org.id}
              organization={org}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">No organizations found</h3>
          <p className="text-muted-foreground mb-6">
            {selectedTagId 
              ? 'No organizations found with the selected tag.'
              : 'No organizations have been created yet.'}
          </p>
          {selectedTagId && (
            <Button 
              variant="outline" 
              onClick={() => setSelectedTagId('')}
              className="mr-4"
            >
              Clear filter
            </Button>
          )}
          <Link to={APP_ROUTES.CREATE_ORGANIZATION}>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Organization
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Organizations;
