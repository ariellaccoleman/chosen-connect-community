
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TagAssignmentWithDetails } from '@/types';
import { EntityType } from '@/types/entityTypes';

// Hook to fetch tags assigned to a public profile
export const usePublicProfileTags = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ['profile-tags', profileId],
    queryFn: async (): Promise<TagAssignmentWithDetails[]> => {
      if (!profileId) return [];
      
      const { data, error } = await supabase
        .from('tag_assignments')
        .select(`
          *,
          tag:tags(*)
        `)
        .eq('target_id', profileId)
        .eq('target_type', EntityType.PERSON);
      
      if (error) {
        console.error('Error fetching profile tags:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!profileId,
  });
};
