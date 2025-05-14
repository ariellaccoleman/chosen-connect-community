
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TagAssignment } from '@/utils/tags';

// Hook to fetch tags assigned to a public profile
export const usePublicProfileTags = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ['public-profile-tags', profileId],
    queryFn: async (): Promise<TagAssignment[]> => {
      if (!profileId) return [];
      
      const { data, error } = await supabase
        .from('tag_assignments')
        .select(`
          *,
          tag:tags(*)
        `)
        .eq('target_id', profileId)
        .eq('target_type', 'person');
      
      if (error) {
        console.error('Error fetching profile tags:', error);
        throw error;
      }
      
      // Ensure the response matches the TagAssignment type
      return (data as TagAssignment[]).map(assignment => ({
        ...assignment,
        // Make sure updated_at is present (required by TagAssignment type)
        updated_at: assignment.updated_at || assignment.created_at
      }));
    },
    enabled: !!profileId,
  });
};
