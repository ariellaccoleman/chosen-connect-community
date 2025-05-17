
/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please update your imports to use the modular structure:
 * import { useProfileById } from '@/hooks/profiles';
 * import { useUpdateProfile } from '@/hooks/profiles';
 */

export { useProfileById as useCurrentProfile } from './profiles/useProfileHooks';
export { useUpdateProfile } from './profiles';
export { useLocationList as useLocations } from './locations';

/**
 * @deprecated Use useProfileById from '@/hooks/profiles' instead
 */
import { useProfileById } from './profiles/useProfileHooks';

export const useProfiles = (userId: string | undefined, authUser?: any) => {
  return useProfileById(userId || authUser?.id);
};
