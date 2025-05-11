
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Define the tag assignment type
interface TagAssignment {
  id: string;
  tag_id: string;
  target_id: string;
  target_type: string;
  created_at: string;
  tag: {
    id: string;
    name: string;
    description: string | null;
    type: string | null;
  };
}

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
      
      return data as TagAssignment[];
    },
    enabled: !!profileId,
  });
};
