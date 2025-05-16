
/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please update your imports to use the modular structure:
 * import { useCurrentProfile } from '@/hooks/profiles';
 * import { useUpdateProfile } from '@/hooks/profiles';
 */

export { useCurrentProfile } from './profiles/useProfileHooks';
export { useUpdateProfile } from './profiles';
export { useLocations } from './useLocations';

/**
 * @deprecated Use useCurrentProfile from '@/hooks/profiles' instead
 */
import { useCurrentProfile as getCurrentProfile } from './profiles/useProfileHooks';

export const useProfiles = (userId: string | undefined, authUser?: any) => {
  return getCurrentProfile(userId, authUser);
};
