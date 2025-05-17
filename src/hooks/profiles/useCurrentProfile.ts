
import { useAuth } from "@/hooks/useAuth";
import { useProfileById } from "./useProfileHooks";

/**
 * Hook to access the current user's profile based on auth context
 * 
 * @returns The current user's profile query result
 */
export const useCurrentProfile = () => {
  const { user } = useAuth();
  return useProfileById(user?.id);
};
