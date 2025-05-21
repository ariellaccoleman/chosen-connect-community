
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TagAssignment } from '@/utils/tags';
import { EntityType } from '@/types/entityTypes';
import { logger } from '@/utils/logger';

// Type that includes the tag details joined from the tags table
export interface TagAssignmentWithDetails extends TagAssignment {
  tag: {
    id: string;
    name: string;
    description: string | null;
    type: string | null;
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
      
      const { data, error } = await supabase
        .from('tag_assignments')
        .select(`
          *,
          tag:tags(*)
        `)
        .eq('target_id', profileId)
        .eq('target_type', EntityType.PERSON);
      
      if (error) {
        logger.error(`usePublicProfileTags: Error fetching tags for profile ${profileId}:`, error);
        return [];
      }
      
      logger.info(`usePublicProfileTags: Found ${data?.length || 0} tags for profile ${profileId}`);
      return data || [] as TagAssignmentWithDetails[];
    },
    enabled: !!profileId,
  });
};
