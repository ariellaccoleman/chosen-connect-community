
import { useQuery } from '@tanstack/react-query';
import { EntityType } from '@/types/entityTypes';
import { logger } from '@/utils/logger';
import { createTagAssignmentService } from '@/api/tags/services';

// Create service instance
const tagAssignmentService = createTagAssignmentService();

// Type that includes the tag details joined from the tags table
export interface TagAssignmentWithDetails {
  id: string;
  tag_id: string;
  target_id: string;
  target_type: string;
  created_at?: string;
  updated_at?: string;
  tag: {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    created_by: string | null;
  };
}

// Hook to fetch tags assigned to a public profile
export const usePublicProfileTags = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ['profile-tags', profileId],
    queryFn: async (): Promise<TagAssignmentWithDetails[]> => {
      if (!profileId) {
        logger.warn('usePublicProfileTags: No profileId provided');
        return [];
      }
      
      logger.info(`usePublicProfileTags: Fetching tags for profile ${profileId}`);
      
      try {
        const response = await tagAssignmentService.getTagsForEntity(profileId, EntityType.PERSON);
        return response.data as TagAssignmentWithDetails[] || [];
      } catch (error) {
        logger.error(`usePublicProfileTags: Error fetching tags for profile ${profileId}:`, error);
        return [];
      }
    },
    enabled: !!profileId,
  });
};
