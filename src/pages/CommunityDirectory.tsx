
import React, { useState } from 'react';
import { useCommunityProfiles } from '@/hooks/profiles';
import { Helmet } from 'react-helmet';
import { Skeleton } from '@/components/ui/skeleton';
import ProfileGrid from '@/components/community/ProfileGrid';
import TagFilter from '@/components/filters/TagFilter';
import { useSelectionTags } from '@/hooks/tags';
import { EntityType } from '@/types/entityTypes';

const CommunityDirectory = () => {
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  const { data: profiles = [], isLoading } = useCommunityProfiles({ tagId: selectedTagId || undefined });
  const { data: tagsResponse, isLoading: tagsLoading } = useSelectionTags(EntityType.PERSON);
  const tags = tagsResponse?.data || [];

  // Handle tag selection
  const handleSelectTag = (tagId: string) => {
    setSelectedTagId(tagId);
  };

  return (
    <div className="container mx-auto py-8">
      <Helmet>
        <title>Community Directory | CHOSEN</title>
      </Helmet>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Community Directory</h1>
        <div className="w-full md:w-72">
          <TagFilter
            selectedTagId={selectedTagId}
            onSelectTag={handleSelectTag}
            tags={tags}
            isLoading={tagsLoading}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        </div>
      ) : profiles.length > 0 ? (
        <ProfileGrid 
          profiles={profiles} 
          isLoading={false} 
          searchQuery=""
        />
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500">No profiles found</p>
          {selectedTagId && (
            <button 
              onClick={() => setSelectedTagId('')}
              className="mt-4 text-blue-500 hover:text-blue-700"
            >
              Clear tag filter
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityDirectory;
